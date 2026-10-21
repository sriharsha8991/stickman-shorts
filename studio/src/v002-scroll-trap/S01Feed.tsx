import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, poseAt, solve, STAND, type Key, type Pose } from "../stickman/stick";
import { Burst, COL, FONT, Slam, countUp } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { DayBg, GROUND, Glow, Heart, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V002 v2 · Why you can't stop scrolling. The feed is a LITERAL paper scroll: a giant phone prints an
// endless ribbon of posts that piles up around YOU. Old web = the ribbon had a bottom tab (NEXT PAGE);
// infinite scroll erases it; pull-to-refresh is a pull-cord that drops random cards; Spark snips the
// ribbon and puts THE END back. Every beat is anchored to a spoken word (VOICE_CUES).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const END = VOICE_FRAMES;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (f: number, xs: number[], ys: number[]) => interpolate(f, xs, ys, { ...clamp, easing: Easing.inOut(Easing.quad) });

// --- key moments ---------------------------------------------------------------
const tDay = () => C(2); // "Web pages used to have a bottom" → daylight flashback
const tStop = () => W(3, 7); // "stop" → YOU looks up
const tErase = () => W(4, 3); // "deleted" → eraser hits the tab
const tPulls = () => [C(7), W(7, 2), W(7, 3)]; // nothing, nothing, JACKPOT
const tJack = () => W(7, 3);
const tAha = () => W(8, 0); // "Random" → bulb
const tSnip = () => W(13, 3); // "bottom" → scissors close
const tAway = () => C(14); // phone leaves for the other room
const tBack = () => C(15); // relapse
const fastPulls = () => [W(8, 2), W(8, 4), W(8, 6), C(9) + 10, C(9) + 30, C(9) + 46];

// --- night / day ---------------------------------------------------------------
const nightAt = (f: number) => ramp(f, [tDay() - 6, tDay() + 4, tBack(), tBack() + 20], [1, 0, 0, 1]);

// --- ribbon speed (posts per frame) and its integral --------------------------
const speedAt = (f: number) => {
  if (f < W(1, 6)) return 1;
  if (f < tDay()) return interpolate(f, [W(1, 6), W(1, 7)], [1, 0], clamp);
  if (f < tErase() + 10) return interpolate(f, [tDay(), tDay() + 8, W(3, 2), W(3, 3)], [0, 0.6, 0.6, 0], clamp);
  if (f < C(6)) return interpolate(f, [tErase() + 10, tErase() + 18], [0, 3.2], clamp);
  if (f < C(10)) return 0.9;
  if (f < C(13)) return interpolate(f, [C(10), C(11)], [0.9, 3.6], clamp);
  if (f < tSnip()) return 1;
  if (f < tBack() + 25) return 0;
  return 1;
};
const FLOW: number[] = [];
for (let i = 0, s = 0; i <= END + 2; i++) {
  FLOW.push(s);
  s += speedAt(i) * 4.2;
}
const flowAt = (f: number) => FLOW[Math.max(0, Math.min(FLOW.length - 1, Math.round(f)))];

// --- paper heap ------------------------------------------------------------------
const heapAt = (f: number) =>
  ramp(
    f,
    [0, tDay(), tDay() + 14, tErase() + 12, C(6), C(10), C(12), tSnip(), tSnip() + 18, tBack() + 10, END - 6],
    [0.6, 0.6, 0.28, 0.28, 0.9, 0.98, 1.5, 1.5, 0.2, 0.2, 0.6],
  );
const HX = 470;

const Heap: React.FC<{ h: number; f: number }> = ({ h, f }) => {
  const w = 300 * (0.65 + 0.35 * h);
  const top = GROUND - 190 * h;
  const pts: string[] = [];
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = HX - w / 2 + t * w;
    const bump = Math.sin(t * Math.PI) ** 0.7;
    const wig = (random(`hp${i}`) - 0.5) * 22 * h;
    pts.push(`${x},${GROUND - (GROUND - top) * bump + wig}`);
  }
  const layers = Math.max(2, Math.round(7 * h));
  return (
    <g>
      <polygon points={`${HX - w / 2 - 10},${GROUND} ${pts.join(" ")} ${HX + w / 2 + 10},${GROUND}`} fill="#ffffff" {...K} />
      {Array.from({ length: layers }, (_, k) => {
        const yy = GROUND - ((k + 0.6) / (layers + 0.4)) * (GROUND - top) * 0.92;
        const span = w * Math.sin(Math.acos(Math.min(1, (GROUND - yy) / (GROUND - top + 1)))) * 0.9;
        const n = Math.max(3, Math.round(span / 34));
        const d = Array.from({ length: n + 1 }, (_, i) => `${HX - span / 2 + (i / n) * span},${yy + (i % 2 ? -12 : 10) + Math.sin(f * 0.05 + k) * 1.5}`).join(" ");
        return <polyline key={k} points={d} fill="none" stroke="#b9c2cf" strokeWidth={4} strokeLinejoin="round" />;
      })}
      {Array.from({ length: Math.round(5 * h) }, (_, i) => (
        <rect
          key={`p${i}`}
          x={HX - w * 0.35 + random(`px${i}`) * w * 0.6}
          y={GROUND - (GROUND - top) * (0.15 + random(`py${i}`) * 0.55)}
          width={34}
          height={20}
          rx={4}
          fill={i % 3 === 0 ? "#ffd166" : "#dfe7f2"}
          transform={`rotate(${(random(`pr${i}`) - 0.5) * 40})`}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
    </g>
  );
};

// --- giant phone -----------------------------------------------------------------
const PW = 260;
const PH = 520;
const phoneX = (f: number) =>
  interpolate(f, [tAway() + 4, tAway() + 26], [0, 520], { ...clamp, easing: Easing.in(Easing.cubic) }) *
    interpolate(f, [tBack(), tBack() + 24], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) }) +
  830;
const SLOT: [number, number] = [-PW / 2 + 6, 1010 - (GROUND - PH / 2)];

const BigPhone: React.FC<{ f: number; x: number; night: number; spin: number }> = ({ f, x, night, spin }) => {
  const scroll = flowAt(f) * 2.2;
  return (
    <g transform={`translate(${x} ${GROUND - PH / 2})`}>
      <rect x={-PW / 2} y={-PH / 2} width={PW} height={PH} rx={42} fill="#1b1b1b" {...K} strokeWidth={7} />
      <clipPath id="bigScreen">
        <rect x={-PW / 2 + 18} y={-PH / 2 + 46} width={PW - 36} height={PH - 92} rx={18} />
      </clipPath>
      <rect x={-PW / 2 + 18} y={-PH / 2 + 46} width={PW - 36} height={PH - 92} rx={18} fill={night > 0.5 ? "#8fdcff" : "#eef5ff"} />
      <g clipPath="url(#bigScreen)">
        {Array.from({ length: 8 }, (_, i) => {
          const cy = ((((i * 92 - scroll) % 736) + 736) % 736) - PH / 2 - 10;
          return (
            <g key={i} transform={`translate(0 ${cy})`}>
              <rect x={-PW / 2 + 32} y={0} width={PW - 64} height={74} rx={10} fill="#fff" stroke="#c8d2df" strokeWidth={3} />
              <circle cx={-PW / 2 + 58} cy={37} r={16} fill={i % 3 === 0 ? COL.orange : i % 3 === 1 ? COL.purple : COL.green} />
              <rect x={-PW / 2 + 84} y={22} width={110} height={10} rx={5} fill="#c8d2df" />
              <rect x={-PW / 2 + 84} y={42} width={70} height={10} rx={5} fill="#dde4ee" />
              {i % 4 === 1 && (
                <g transform={`translate(${PW / 2 - 52} 38)`}>
                  <Heart s={0.45} />
                </g>
              )}
            </g>
          );
        })}
        {spin > 0 && (
          <g transform={`translate(0 ${-PH / 2 + 90}) rotate(${spin * 900})`} opacity={Math.min(1, spin * 5)}>
            <circle r={20} fill="#fff" stroke={COL.ink} strokeWidth={3} />
            <circle r={12} fill="none" stroke={COL.blue} strokeWidth={5} strokeDasharray="44 26" />
          </g>
        )}
      </g>
      <rect x={-34} y={-PH / 2 + 16} width={68} height={14} rx={7} fill="#333" />
      {/* the print slot on the left side */}
      <rect x={SLOT[0] - 10} y={SLOT[1] - 30} width={16} height={60} rx={6} fill={COL.ink} />
    </g>
  );
};

// --- YOU (orange) --------------------------------------------------------------------
const YS = 1.6;
const YOU_BASE: Partial<Pose> = { x: 540, y: GROUND - 92.5 * YS };
const SIT_Y = GROUND - 54 * YS;
const READ: Partial<Pose> = { ...P.sit, y: SIT_Y, la1: 55, la2: 55, ra1: 70, ra2: 45, head: 14, lean: 4 };
const REACH: Partial<Pose> = { ...P.sit, y: SIT_Y, la1: 40, la2: 50, ra1: 152, ra2: 4, head: -12, lean: -2 };
const UP: Partial<Pose> = { y: GROUND - 92.5 * YS, ll1: -12, ll2: 4, rl1: 12, rl2: -4, lean: 0, head: 0, la1: -18, la2: 8, ra1: 18, ra2: -8 };
const YANK: Partial<Pose> = { ...REACH, ra1: 112, ra2: 18, lean: 10, head: 4 };

const pullKeys = (ats: number[]): Key[] =>
  ats.flatMap((a) => [
    { f: a - 4, p: REACH },
    { f: a, p: YANK, e: SNAP },
    { f: a + 7, p: REACH },
  ]);

const YOU_KEYS = (): Key[] => [
  { f: 0, p: READ },
  { f: tStop() - 4, p: READ },
  { f: tStop() + 2, p: { ...READ, head: -14, la1: -150, la2: -20, ra1: 150, ra2: 20 }, e: SNAP }, // a chance to stop: look up, stretch
  { f: C(4) - 2, p: { ...READ, head: -14, la1: -150, la2: -20, ra1: 150, ra2: 20 } },
  { f: C(4) + 6, p: READ },
  { f: tErase() + 12, p: READ },
  { f: tErase() + 16, p: { ...READ, head: 20, lean: 10 }, e: SNAP }, // hooked again
  { f: C(6) + 4, p: { ...READ, head: 20, lean: 10 } },
  { f: C(6) + 14, p: REACH },
  ...pullKeys(tPulls()),
  { f: tJack() + 8, p: { ...P.sit, y: SIT_Y, la1: -150, la2: -30, ra1: 150, ra2: 30, head: -8 }, e: SNAP }, // jackpot!
  { f: C(8) + 4, p: { ...P.sit, y: SIT_Y, la1: -150, la2: -30, ra1: 150, ra2: 30, head: -8 } },
  { f: C(8) + 12, p: REACH },
  ...pullKeys(fastPulls()),
  { f: C(10) + 8, p: READ },
  { f: C(12) - 2, p: READ },
  { f: C(12) + 4, p: { ...READ, head: 26, lean: 14 }, e: SNAP }, // buried
  { f: tSnip() + 6, p: { ...READ, head: 26, lean: 14 } },
  { f: tSnip() + 18, p: { ...UP, la1: -30, ra1: 30 } }, // stands up, free
  { f: C(14) + 6, p: UP },
  { f: C(14) + 12, p: { ...UP, ...P.cheer }, e: SNAP },
  { f: tBack() + 4, p: { ...UP, ...P.cheer } },
  { f: tBack() + 16, p: { ...UP, head: 10 } },
  { f: W(15, 3), p: READ },
];

const youJoints = (f: number) => {
  const p = poseAt(f, YOU_KEYS(), { ...STAND, ...YOU_BASE });
  return solve(addPose(p, idle(f, 4)), YS, 1);
};

// --- props -----------------------------------------------------------------------------
const Ribbon: React.FC<{ d: string; flow: number; o?: number }> = ({ d, flow, o = 1 }) => (
  <g opacity={o}>
    <path d={d} fill="none" stroke={COL.ink} strokeWidth={56} strokeLinecap="butt" />
    <path d={d} fill="none" stroke="#ffffff" strokeWidth={44} strokeLinecap="butt" />
    <path d={d} fill="none" stroke="#c9d3e0" strokeWidth={26} strokeDasharray="22 16" strokeDashoffset={-flow} />
    <path d={d} fill="none" stroke="#ffd166" strokeWidth={26} strokeDasharray="22 168" strokeDashoffset={-flow} />
  </g>
);

const Tab: React.FC<{ x: number; y: number; t: number; text: string; color: string; r?: number }> = ({ x, y, t, text, color, r = 0 }) => {
  if (t <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${t})`}>
      <rect x={-130} y={-44} width={260} height={88} rx={12} fill="#fff" stroke={color} strokeWidth={7} />
      <line x1={-130} y1={-52} x2={130} y2={-52} stroke={COL.ink} strokeWidth={5} strokeDasharray="12 9" />
      <text y={16} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={48} letterSpacing={2} fill={color}>
        {text}
      </text>
    </g>
  );
};

const Eraser: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-110} y={-48} width={220} height={96} rx={16} fill="#ff9fb3" {...K} />
    <rect x={-110} y={-48} width={80} height={96} rx={16} fill="#5aa9e6" {...K} />
    <text x={40} y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={COL.ink}>
      ERASE
    </text>
  </g>
);

const Scissors: React.FC<{ x: number; y: number; open: number; r?: number }> = ({ x, y, open, r = 0 }) => {
  const a = 6 + open * 22;
  const blade = (s: number) => (
    <g transform={`rotate(${s * a})`}>
      <path d="M 0 0 L 150 -10 L 160 0 L 150 10 Z" fill="#dfe6ee" {...K} strokeWidth={5} />
      <ellipse cx={-52} cy={s * 20} rx={34} ry={22} fill="none" stroke={COL.red} strokeWidth={13} />
      <line x1={-20} y1={s * 10} x2={0} y2={0} stroke={COL.red} strokeWidth={13} strokeLinecap="round" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      {blade(-1)}
      {blade(1)}
      <circle r={9} fill={COL.ink} />
    </g>
  );
};

const Door: React.FC<{ t: number }> = ({ t }) => {
  if (t <= 0.01) return null;
  return (
    <g opacity={t} transform={`translate(${lerp(140, 0, t)} 0)`}>
      <rect x={960} y={800} width={150} height={GROUND - 800} fill="#8c5a3c" {...K} />
      <rect x={978} y={820} width={114} height={GROUND - 838} fill="#3a2a22" />
      <circle cx={985} cy={1060} r={9} fill={COL.yellow} stroke={COL.ink} strokeWidth={3} />
      <g transform="translate(850 760) rotate(-4)">
        <rect x={-120} y={-36} width={240} height={72} rx={10} fill={COL.yellow} {...K} strokeWidth={5} />
        <text y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={COL.ink}>
          OTHER ROOM →
        </text>
      </g>
    </g>
  );
};

const Timer: React.FC<{ f: number; at: number; t: number }> = ({ f, at, t }) => {
  if (t <= 0.01) return null;
  const s = interpolate(f - at, [0, 6, 10], [0.3, 1.12, 1], clamp) * t;
  const left = interpolate(f, [at, at + 60], [1, 0.72], clamp);
  const a = left * Math.PI * 2;
  const R = 78;
  const ex = Math.sin(a) * R;
  const ey = -Math.cos(a) * R;
  return (
    <g transform={`translate(800 1080) scale(${s}) rotate(${Math.sin(f * 0.8) * (f - at < 24 ? 4 : 0)})`}>
      <rect x={-18} y={-R - 34} width={36} height={24} rx={6} fill={COL.ink} />
      <circle r={R + 14} fill="#fff" {...K} />
      <path d={`M 0 0 L 0 ${-R} A ${R} ${R} 0 ${a > Math.PI ? 1 : 0} 1 ${ex} ${ey} Z`} fill={COL.green} opacity={0.85} />
      <circle r={10} fill={COL.ink} />
      <text y={R + 70} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={46} fill={COL.ink}>
        APP TIMER
      </text>
    </g>
  );
};

// cards that pop out of the phone on every pull
type Drop = { at: number; kind: "none" | "jackpot" | "like"; big: boolean };
const DROPS = (): Drop[] => [
  { at: tPulls()[0], kind: "none", big: true },
  { at: tPulls()[1], kind: "none", big: true },
  { at: tPulls()[2], kind: "jackpot", big: true },
  ...fastPulls().map((a, i): Drop => ({ at: a, kind: [1, 4].includes(i) ? "like" : "none", big: false })),
];

const DropCard: React.FC<{ f: number; d: Drop; x0: number; i: number }> = ({ f, d, x0, i }) => {
  const t = f - d.at;
  const life = d.big ? (d.kind === "jackpot" ? C(8) + 6 - d.at : 16) : 18;
  if (t < 0 || t > life + 10) return null;
  const rise = interpolate(t, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const out = interpolate(t, [life, life + 10], [0, 1], clamp);
  const tx = d.big ? 540 : 620 + ((i * 97) % 220);
  const ty = d.big ? 560 : 560 - ((i * 53) % 120);
  const x = lerp(x0, tx, rise) + out * (d.big ? -40 : 60);
  const y = lerp(GROUND - PH, ty, rise) - out * 160;
  const s = (d.big ? 1 : 0.55) * lerp(0.3, 1, rise);
  const gold = d.kind === "jackpot";
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${(i % 2 ? 1 : -1) * (gold ? 0 : 5)})`} opacity={1 - out}>
      <rect x={-200} y={-110} width={400} height={220} rx={26} fill={gold ? COL.gold : "#e9edf2"} {...K} strokeWidth={7} />
      {d.kind === "none" ? (
        <text y={34} textAnchor="middle" fontFamily={FONT.comic} fontSize={110} fill="#9aa4b1">
          · · ·
        </text>
      ) : (
        <>
          <g transform="translate(-80 4)">
            <Heart s={gold ? 2 : 1.6} />
          </g>
          <text x={70} y={34} textAnchor="middle" fontFamily={FONT.comic} fontSize={gold ? 96 : 80} fill={gold ? COL.red : COL.ink} stroke={COL.ink} strokeWidth={gold ? 3 : 0}>
            {gold ? "99+" : "+1"}
          </text>
        </>
      )}
    </g>
  );
};

// --- sfx --------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [W(0, 3), "pop", 0.5],
  [W(1, 5), "stamp", 0.7],
  [W(1, 7), "slam", 0.8],
  [W(1, 7) + 2, "freeze", 0.5],
  [tDay() - 6, "whoosh_long", 0.5],
  [W(2, 6), "page", 0.6],
  [W(3, 2), "ding", 0.5],
  [tStop(), "boing", 0.4],
  [tErase() - 10, "whoosh", 0.5],
  ...Array.from({ length: 4 }, (_, i): SfxCue => [tErase() + i * 3, "scribble", 0.45]),
  [W(4, 1), "stamp", 0.7],
  [tErase() + 14, "swirl", 0.5],
  [W(5, 0), "slam", 0.6],
  [W(5, 2), "slam", 0.6],
  [W(6, 1), "swish", 0.5],
  ...tPulls().map((a): SfxCue => [a, "clink", 0.6]),
  [tPulls()[0] + 6, "pop", 0.4],
  [tPulls()[1] + 6, "pop", 0.4],
  [tJack() + 4, "kaching", 0.9],
  [tJack() + 6, "gold", 0.6],
  [tAha(), "ding", 0.7],
  ...fastPulls().map((a): SfxCue => [a, "clink", 0.4]),
  [C(9) - 2, "thud", 0.6],
  [C(11), "riser", 0.5],
  ...Array.from({ length: 8 }, (_, i): SfxCue => [W(11, 3) + i * 4, "tick", 0.35]),
  [W(11, 7), "impact", 0.8],
  [W(12, 0), "punch", 0.6],
  [W(12, 1), "punch", 0.65],
  [W(12, 2), "punch", 0.75],
  [W(13, 0), "swish", 0.5],
  [tSnip(), "shatter", 0.35],
  [tSnip() + 1, "stamp", 0.7],
  [tAway() + 6, "whoosh_long", 0.6],
  [W(14, 4), "pop", 0.5],
  [W(14, 7), "ding", 0.6],
  [tBack() + 2, "whoosh", 0.5],
  [W(15, 5), "slam", 0.6],
];

// --- scene ------------------------------------------------------------------------------
export const S01Feed: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const night = nightAt(f);
  const h = heapAt(f);
  const flow = flowAt(f);
  const px = phoneX(f);
  const yj = youJoints(f);
  const hands: [number, number] = [(yj.lHand[0] + yj.rHand[0]) / 2, (yj.lHand[1] + yj.rHand[1]) / 2];
  const pulling = f >= C(6) + 8 && f < C(10) + 6;
  const hold: [number, number] = pulling ? [yj.lHand[0], yj.lHand[1]] : hands;

  // ribbon: phone slot → YOU's hands → heap
  const A: [number, number] = [px + SLOT[0] - 6, GROUND - PH / 2 + SLOT[1]];
  const Hp: [number, number] = [HX + 40, GROUND - 170 * h];
  const seg1 = `M ${A[0]} ${A[1]} C ${A[0] - 70} ${A[1] + 10} ${hold[0] + 70} ${hold[1] - 50} ${hold[0]} ${hold[1]}`;
  const seg2 = `M ${hold[0]} ${hold[1]} C ${hold[0] - 30} ${hold[1] + 40} ${Hp[0] + 60} ${Hp[1] - 40} ${Hp[0]} ${Hp[1]}`;
  const attached = interpolate(f, [tSnip(), tSnip() + 6, tBack() + 22, tBack() + 30], [1, 0, 0, 1], clamp);

  const tail = interpolate(f, [tSnip() + 6, tSnip() + 14, tBack() + 22, tBack() + 30], [1, 0, 0, 1], clamp);

  // the old web's bottom tab, then the eraser
  const tabIn = interpolate(f, [W(2, 5), W(2, 5) + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const tabGone = interpolate(f, [tErase() + 2, tErase() + 12], [1, 0], clamp);
  const tabT = tabIn * tabGone * (f < tErase() + 14 ? 1 : 0);
  const er = interpolate(f, [tErase() - 10, tErase() - 1], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const erOut = interpolate(f, [tErase() + 12, tErase() + 22], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const tabPos: [number, number] = [660, 875];
  const eraserX = lerp(1250, tabPos[0], er) + (f >= tErase() && f < tErase() + 12 ? Math.sin((f - tErase()) * 1.6) * 60 : 0) + erOut * 500;
  const eraserY = lerp(380, tabPos[1] - 20, er) - erOut * 700;

  // pull cord from the phone's top corner to YOU's right hand
  const cordTop: [number, number] = [px - PW / 2 + 30, GROUND - PH + 30];
  const spin = Math.max(0, ...[...tPulls(), ...fastPulls()].map((a) => (f >= a && f < a + 14 ? 1 - (f - a) / 14 : 0)));

  // scissors
  const scT = interpolate(f, [W(13, 0), tSnip() - 2], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const scOut = interpolate(f, [tSnip() + 12, tSnip() + 24], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const cut: [number, number] = [hands[0] + 80, hands[1] - 18];
  const scOpen = f < tSnip() ? 0.5 + 0.5 * Math.abs(Math.sin(f * 0.5)) : 0;
  const endTab = interpolate(f, [tSnip(), tSnip() + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) }) * interpolate(f, [C(14) + 6, C(14) + 14], [1, 0], clamp);

  const ej = youJoints(tSnip());
  const endPos: [number, number] = [(ej.lHand[0] + ej.rHand[0]) / 2, (ej.lHand[1] + ej.rHand[1]) / 2 + Math.min(0, 0)];
  const door = interpolate(f, [tAway() - 4, tAway() + 6, tBack() + 18, tBack() + 30], [0, 1, 1, 0], clamp);
  const timerT = interpolate(f, [W(14, 4) - 1, W(14, 4), tBack(), tBack() + 8], [0, 1, 1, 0], clamp);

  // camera
  const z = punch(
    f,
    [W(0, 3), W(1, 7), tDay(), tErase(), W(5, 0), W(5, 2), ...tPulls(), tAha(), C(9), W(11, 7), W(12, 0), W(12, 1), W(12, 2), tSnip(), tAway() + 6, W(15, 5)],
    0.04,
  );
  const jz = interpolate(f, [tJack(), tJack() + 8, C(8) - 6, C(8) + 4], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cam = { z: z * (1 + jz * 0.06), x: 0, y: -jz * 40 };

  const mood = (t: number): Mood =>
    t >= C(1) && t < C(2)
      ? "smug"
      : t >= tErase() && t < C(6)
        ? "shock"
        : t >= tJack() && t < C(8)
          ? "happy"
          : t >= C(11) && t < C(12)
            ? "shock"
            : t >= C(12) && t < C(13)
              ? "sad"
              : t >= C(13) && t < tBack()
                ? "happy"
                : t >= tBack() && t < END - 10
                  ? "smug"
                  : "neutral";

  const clockVis = Math.max(interpolate(f, [C(1) - 8, C(1) - 2], [1, 0], clamp), interpolate(f, [W(15, 5), W(15, 5) + 4], [0, 1], clamp));
  const clockPop = f >= W(15, 5) ? interpolate(f - W(15, 5), [0, 5, 9, 13], [2.2, 0.94, 1.04, 1], clamp) : 1 + 0.08 * Math.exp(-Math.max(0, f - W(0, 3)) / 5) * (f >= W(0, 3) ? 1 : 0);
  const nCount = countUp(f, W(11, 3), W(11, 7), 100000, 0);

  return (
    <Stage
      bg={<DayBg tint="#f3f1ea" />}
      hits={[W(1, 7), tErase(), tJack(), W(11, 7), W(12, 2), tSnip()]}
      power={12}
      cam={cam}
      svg={
        <>
          {/* night tint over the paper background */}
          <rect x={-600} y={-600} width={2280} height={3200} fill="#0f1638" opacity={0.8 * night} />
          {night > 0.02 && (
            <g opacity={night}>
              <circle cx={880} cy={330} r={56} fill="#f5f0d0" />
              <circle cx={905} cy={312} r={52} fill="#0f1638" opacity={0.9} />
              {Array.from({ length: 22 }, (_, i) => (
                <circle key={i} cx={random(`st${i}`) * 1080} cy={150 + random(`sy${i}`) * 560} r={2 + random(`sr${i}`) * 2} fill="#fff" opacity={0.4 + 0.3 * Math.sin(f * 0.08 + i)} />
              ))}
              <Glow x={px - 60} y={1000} r={430} o={0.4} />
            </g>
          )}

          {/* pull cord (behind the phone edge, to YOU's right hand) */}
          {pulling && (
            <g>
              <path d={`M ${cordTop[0]} ${cordTop[1]} Q ${(cordTop[0] + yj.rHand[0]) / 2 - 30} ${cordTop[1] + 40} ${yj.rHand[0]} ${yj.rHand[1]}`} fill="none" stroke={COL.ink} strokeWidth={7} />
              <circle cx={yj.rHand[0]} cy={yj.rHand[1] + 6} r={20} fill={COL.red} stroke={COL.ink} strokeWidth={5} />
            </g>
          )}

          <BigPhone f={f} x={px} night={night} spin={spin} />
          <Door t={door} />

          {/* drops from the phone */}
          {DROPS().map((d, i) => (
            <DropCard key={i} f={f} d={d} x0={px} i={i} />
          ))}
          {f >= tJack() && f < tJack() + 30 && <Burst x={540} y={560} at={tJack() + 2} f={f} size={340} color={COL.gold} />}

          {/* ribbon to the hands, YOU, ribbon to the heap, heap in front of YOU's legs */}
          <Ribbon d={seg1} flow={flow} o={attached} />
          <Ribbon d={seg2} flow={flow} o={tail} />
          <Actor
            f={f}
            color={COL.orange}
            scale={YS}
            label="YOU"
            face="eyes"
            base={YOU_BASE}
            keys={YOU_KEYS()}
            mod={(t, p) => addPose(p, idle(t, 4))}
          />
          <Heap h={h} f={f} />

          <Tab x={tabPos[0]} y={tabPos[1]} t={tabT} text="NEXT PAGE ›" color={COL.blue} r={-6} />
          {f >= tErase() && f < tErase() + 20 && <Burst x={tabPos[0]} y={tabPos[1]} at={tErase() + 4} f={f} size={160} color="#ff9fb3" />}
          {er > 0 && erOut < 1 && <Eraser x={eraserX} y={eraserY} r={-18 + Math.sin(f * 0.9) * 6} />}

          <Tab x={endPos[0] + 40} y={endPos[1] - 80} t={endTab} text="THE END" color={COL.red} r={4} />
          {scT > 0 && scOut < 1 && <Scissors x={lerp(300, cut[0], scT) + scOut * -400} y={lerp(1050, cut[1], scT) - scOut * 500} open={scOpen} r={-20} />}
          <Timer f={f} at={W(14, 4)} t={timerT} />

          {/* SPARK, the host */}
          <Spark
            f={f}
            scale={1.85}
            base={{ x: 175, y: GROUND - 92.5 * 1.85 }}
            talk={(t) => mouthAt(t)}
            bulb={(t) => bulbPulse(t, tAha(), 44)}
            mood={mood}
            look={f >= C(9) && f < C(10) ? 0.6 : 1}
            keys={[
              { f: 0, p: { ...P.pointR, ra1: 80 } },
              { f: C(1) - 3, p: { ...P.pointR, ra1: 80 } },
              { f: C(1) + 3, p: { ra1: 165, ra2: 5, la1: -18 }, e: SNAP }, // finger up: "nobody told you"
              { f: tDay() - 2, p: { ra1: 165, ra2: 5 } },
              { f: tDay() + 6, p: { ...P.pointR, ra1: 120 }, e: SNAP }, // the bottom tab
              { f: tErase() - 2, p: { ...P.pointR, ra1: 120 } },
              { f: tErase() + 4, p: { ...P.shock }, e: SNAP },
              { f: C(6) - 2, p: { ...P.shock } },
              { f: C(6) + 6, p: { ...P.think, lean: 8 } },
              { f: tJack() - 2, p: { ...P.think, lean: 8 } },
              { f: tJack() + 4, p: { ...P.armsUp }, e: SNAP },
              { f: tAha() - 4, p: { ...P.armsUp } },
              { f: tAha() + 2, p: { ra1: 165, ra2: 5, la1: -18 }, e: SNAP }, // aha: finger up
              { f: W(8, 4), p: { ra1: 165, ra2: 5, la1: -18 } },
              { f: W(8, 4) + 6, p: { ...P.pointR, ra1: 95 }, e: SNAP },
              { f: C(9) - 2, p: { ...P.pointR, ra1: 95 } },
              { f: C(9) + 4, p: { ...P.pointR, ra1: 150, ra2: 0 }, e: SNAP }, // the quote card
              { f: C(10) - 2, p: { ...P.pointR, ra1: 150, ra2: 0 } },
              { f: C(10) + 4, p: { ...P.think } },
              { f: C(11) - 2, p: { ...P.think } },
              { f: W(11, 7), p: { ...P.shock }, e: SNAP },
              { f: C(12) - 2, p: { ...P.shock } },
              { f: C(12) + 4, p: { ...P.sad }, e: SNAP },
              { f: C(13) - 2, p: { ...P.sad } },
              { f: W(13, 0) - 2, p: { ...P.punchR, lean: 4 }, e: SNAP }, // throws the scissors
              { f: tSnip() + 4, p: { ...P.punchR, lean: 4 } },
              { f: tSnip() + 10, p: { ...P.cheer }, e: SNAP },
              { f: C(14) - 2, p: { ...P.cheer } },
              { f: C(14) + 4, p: { ...P.pointR, ra1: 100 }, e: SNAP }, // other room
              { f: tBack() - 2, p: { ...P.pointR, ra1: 100 } },
              { f: tBack() + 4, p: { ...P.shrug }, e: SNAP },
              { f: END - 10, p: { ...P.shrug } },
              { f: END - 2, p: { ...P.pointR, ra1: 80 } }, // loop: frame 0 pose
            ]}
            mod={(t, p) => addPose(p, idle(t, 9))}
          />
        </>
      }
      html={
        <>
          {/* hook overlay: works muted, also the loop's last frame */}
          {clockVis > 0 && (
            <div style={{ position: "absolute", left: 0, width: 1080, top: 250, textAlign: "center", opacity: clockVis, transform: `scale(${clockPop})` }}>
              <div
                style={{
                  display: "inline-block",
                  fontFamily: FONT.comic,
                  fontSize: 170,
                  color: "#ffffff",
                  WebkitTextStroke: `10px ${COL.ink}`,
                  paintOrder: "stroke fill",
                  letterSpacing: 4,
                  lineHeight: 1,
                }}
              >
                2:47 AM
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontFamily: FONT.title,
                  fontWeight: 900,
                  fontSize: 92,
                  color: COL.yellow,
                  WebkitTextStroke: `7px ${COL.ink}`,
                  paintOrder: "stroke fill",
                  letterSpacing: 3,
                }}
              >
                STILL SCROLLING.
              </div>
            </div>
          )}

          {f < tDay() + 2 && <Stamp f={f} at={W(1, 5)} x={540} y={320} text="DELETED" size={92} r={-8} />}
          <Slam f={f} at={W(1, 7)} out={tDay() - 6} x={540} y={500} size={230} color={COL.yellow} stroke={`10px ${COL.ink}`} rotate={-3}>
            2006
          </Slam>

          <Slam f={f} at={W(2, 6)} out={C(4) - 6} x={540} y={330} size={110} font={FONT.title} weight={900} color={COL.ink}>
            THE BOTTOM ↓
          </Slam>
          <Slam f={f} at={W(3, 6)} out={C(4) - 6} x={540} y={470} size={88} color={COL.blue}>
            A CHANCE TO STOP
          </Slam>

          {f < C(5) && <Stamp f={f} at={W(4, 1)} x={540} y={400} text="INFINITE SCROLL" size={92} r={-6} />}
          <Slam f={f} at={W(5, 0)} out={C(6) - 4} x={540} y={330} size={130} color={COL.red} stroke={`8px ${COL.ink}`} rotate={-2}>
            NO BOTTOM.
          </Slam>
          <Slam f={f} at={W(5, 2)} out={C(6) - 4} x={540} y={480} size={84} font={FONT.title} weight={900} color={COL.ink}>
            NO REASON TO STOP.
          </Slam>

          <Slam f={f} at={W(6, 1)} out={C(7) - 2} x={540} y={320} size={96} color={COL.blue} stroke={`6px ${COL.ink}`}>
            PULL TO REFRESH
          </Slam>
          <Slam f={f} at={W(8, 1)} out={C(9) - 4} x={540} y={300} size={96} font={FONT.title} weight={900} color={COL.ink}>
            VARIABLE REWARD
          </Slam>

          {/* the quote */}
          {f >= C(9) - 2 && f < C(10) + 4 && (
            <div
              style={{
                position: "absolute",
                left: 110,
                width: 860,
                top: 270,
                transform: `scale(${interpolate(f - C(9) + 2, [0, 6, 10], [0.5, 1.05, 1], clamp)}) rotate(-2deg)`,
                opacity: interpolate(f, [C(9) - 2, C(9) + 2, C(10), C(10) + 4], [0, 1, 1, 0], clamp),
                background: "#fff",
                border: `7px solid ${COL.ink}`,
                borderRadius: 26,
                boxShadow: `12px 12px 0 ${COL.ink}`,
                padding: "26px 34px",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: FONT.comic, fontSize: 92, color: COL.ink, lineHeight: 1.05 }}>“PULL-TO-REFRESH IS ADDICTIVE.”</div>
              <div style={{ marginTop: 14, fontFamily: FONT.body, fontWeight: 700, fontSize: 32, color: COL.grey }}>Loren Brichter, its inventor · The Guardian, 2017</div>
            </div>
          )}

          {/* the estimate */}
          {f >= C(11) && f < C(12) + 2 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                width: 1080,
                top: 250,
                textAlign: "center",
                opacity: interpolate(f, [C(11), C(11) + 4, C(12) - 2, C(12) + 2], [0, 1, 1, 0], clamp),
                transform: `scale(${f >= W(11, 7) ? interpolate(f - W(11, 7), [0, 4, 8], [1.18, 0.97, 1], clamp) : 1})`,
              }}
            >
              <div style={{ fontFamily: FONT.comic, fontSize: 190, color: COL.red, WebkitTextStroke: `9px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 1 }}>
                {nCount.toLocaleString("en-US")}
              </div>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 64, color: COL.ink, letterSpacing: 2, opacity: f >= W(11, 7) ? 1 : 0.25 }}>HUMAN LIFETIMES · PER DAY</div>
              <div style={{ marginTop: 6, fontFamily: FONT.body, fontWeight: 700, fontSize: 32, color: "#555" }}>Aza Raskin's own rough estimate (infinite scroll, 2006)</div>
            </div>
          )}
          <Slam f={f} at={W(12, 0)} out={C(13) - 4} x={540} y={300} size={130} color={COL.ink}>
            EVERY.
          </Slam>
          <Slam f={f} at={W(12, 1)} out={C(13) - 4} x={540} y={430} size={130} color={COL.ink}>
            SINGLE.
          </Slam>
          <Slam f={f} at={W(12, 2)} out={C(13) - 4} x={540} y={570} size={160} color={COL.red} stroke={`9px ${COL.ink}`}>
            DAY.
          </Slam>

          <Slam f={f} at={W(13, 1)} out={C(14) - 4} x={540} y={330} size={100} font={FONT.title} weight={900} color={COL.ink}>
            PUT THE BOTTOM BACK
          </Slam>
          <Slam f={f} at={W(14, 0)} out={tBack() - 4} x={540} y={300} size={80} font={FONT.title} weight={900} color={COL.ink}>
            1 · PHONE IN ANOTHER ROOM
          </Slam>
          <Slam f={f} at={W(14, 4)} out={tBack() - 4} x={540} y={410} size={80} font={FONT.title} weight={900} color={COL.green}>
            2 · TIMER ON THE APP
          </Slam>

          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["hours", "deleted", "2006", "bottom", "jackpot", "random", "addictive", "lifetimes", "day", "back", "fortyseven"]} />
        </>
      }
    />
  );
};
