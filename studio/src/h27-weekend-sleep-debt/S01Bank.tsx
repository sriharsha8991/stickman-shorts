import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H27 · You can't catch up on sleep at the weekend. Myth vs Reality in a lavender "SLEEP BANK" (peach floor,
// Spark on the RIGHT this time). A pink piggy bank labelled SLEEP. A 9-day strip: MON–FRI "5h", SAT/SUN
// "LIE-IN", then MON/TUE "5h" again. The LIE-IN coins bounce off the slot (MYTH / NOPE). A gauge for insulin
// sensitivity drops: "UP TO −27%" (wow). Cookie + scale (snacking, weight), a clock whose hands slide later,
// a yo-yo bouncing between 5h and LIE-IN. Caveat pill. Steady weekday coins drop in. Monday alarm rings (loop).
// Depner et al. 2019, Current Biology 29(6):957–967 (n=36, 2-week lab study). Education, not medical advice.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) =>
  interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const PIG = "#ff8fb1";
const COIN = "#ffcf3f";
const RED = "#e5322d";
const MINT = "#2fbf71";
const INDIGO = "#4b3fa8";

// --- anchors ----------------------------------------------------------------------------------------
const T = {
  weekend: W(0, 3),
  pays: W(0, 5),
  nights: W(0, 8),
  body: C(1),
  disagrees: W(1, 2),
  lab: W(2, 2),
  five: W(2, 6),
  night: W(2, 9),
  group: C(3),
  sleepIn: W(3, 4),
  weekendAll: W(3, 7),
  monday: W(4, 1),
  short: W(4, 5),
  back: W(4, 8),
  did: C(5),
  fix: W(5, 3),
  nope: W(5, 5),
  insulin: C(6),
  sugar: W(6, 6),
  still: C(7),
  fell: W(7, 1),
  n27: W(7, 5),
  snacked: W(8, 1),
  dinner: W(8, 3),
  gained: W(8, 5),
  clocks: W(9, 3),
  later: W(9, 5),
  yoyo: W(10, 1),
  may: W(10, 3),
  small: C(11),
  n36: W(11, 2),
  weeks: W(11, 6),
  protect: W(12, 1),
  steady: W(12, 3),
  weekdays: W(12, 7),
  before: C(13),
  alarm: W(13, 2),
  again: W(13, 4),
};
const LOOP = VOICE_FRAMES - 20;

// --- background: lavender sleep bank ------------------------------------------------------------------
const Bank: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="h27wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1ebff" />
          <stop offset="100%" stopColor="#d6caff" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#h27wall)" />
      {/* columns */}
      {[70, 1010].map((x) => (
        <g key={x}>
          <rect x={x - 34} y={200} width={68} height={GROUND - 200} fill="#e7defc" stroke="#b9a8f0" strokeWidth={5} />
          <rect x={x - 46} y={186} width={92} height={24} fill="#cbbcf7" stroke="#b9a8f0" strokeWidth={4} />
        </g>
      ))}
      {/* stars + moon drifting on the wall */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = 150 + ((i * 97) % 780);
        const y = 220 + ((i * 53) % 380);
        const tw = 0.35 + 0.25 * Math.sin((f + i * 11) / 9);
        return <circle key={i} cx={x} cy={y} r={5 + (i % 3) * 2} fill="#b9a8f0" opacity={tw} />;
      })}
      {/* floor */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#ffd2b0" />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={i * 180} y1={GROUND} x2={i * 180 - 120} y2={1920} stroke="#f2b48c" strokeWidth={4} />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
    </svg>
  </AbsoluteFill>
);

// piggy bank (sits on the floor)
const Piggy: React.FC<{ x: number; k: number; tilt: number; happy: boolean }> = ({ x, k, tilt, happy }) => (
  <g transform={`translate(${x} ${GROUND}) scale(${k}) rotate(${tilt} 0 -10)`}>
    {[-110, -50, 50, 110].map((lx) => (
      <rect key={lx} x={lx - 18} y={-60} width={36} height={60} rx={10} fill="#ff7aa2" {...K} strokeWidth={5} />
    ))}
    <ellipse cx={0} cy={-170} rx={200} ry={135} fill={PIG} {...K} />
    <path d="M 196 -190 q 40 -10 36 22 q -4 24 -30 8" fill="none" {...K} strokeWidth={6} />
    <ellipse cx={-205} cy={-160} rx={40} ry={46} fill="#ff7aa2" {...K} strokeWidth={5} />
    <circle cx={-214} cy={-166} r={7} fill={COL.ink} />
    <circle cx={-196} cy={-150} r={7} fill={COL.ink} />
    <path d="M -150 -290 L -120 -330 L -96 -282 Z" fill="#ff7aa2" {...K} strokeWidth={5} />
    <circle cx={-130} cy={-210} r={11} fill={COL.ink} />
    {happy ? (
      <path d="M -160 -120 Q -130 -100 -100 -120" fill="none" {...K} strokeWidth={5} />
    ) : (
      <path d="M -160 -108 Q -130 -126 -100 -108" fill="none" {...K} strokeWidth={5} />
    )}
    {/* coin slot */}
    <rect x={-50} y={-310} width={100} height={18} rx={9} fill={COL.ink} />
    <text x={30} y={-150} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill="#fff" stroke={COL.ink} strokeWidth={2.5}>
      SLEEP
    </text>
  </g>
);

const Coin: React.FC<{ x: number; y: number; label: string; k?: number; r?: number; col?: string }> = ({ x, y, label, k = 1, r = 0, col = COIN }) =>
  k > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${k}) rotate(${r})`}>
      <circle r={62} fill={col} {...K} />
      <circle r={46} fill="none" stroke="#e0a91c" strokeWidth={5} />
      <text y={12} textAnchor="middle" fontFamily={FONT.comic} fontSize={label.length > 5 ? 26 : 34} fill={COL.ink}>
        {label}
      </text>
    </g>
  ) : null;

// --- sfx ----------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "pop", 0.35],
  [T.pays, "clink", 0.45],
  [T.disagrees - 6, "boing", 0.55],
  [T.disagrees, "stamp", 0.65],
  [T.lab, "page", 0.4],
  ...Array.from({ length: 5 }, (_, i): SfxCue => [T.five + i * 4, "tick", 0.25]),
  [T.sleepIn, "swish", 0.4],
  [T.monday, "buzz", 0.35],
  [T.short, "tick", 0.25],
  [T.fix, "boing", 0.5],
  [T.nope, "slam", 0.6],
  [T.insulin, "whoosh", 0.35],
  [T.n27 - 18, "riser", 0.45],
  [T.n27, "impact", 0.8],
  [T.snacked, "pop", 0.4],
  [T.gained, "thud", 0.45],
  [T.clocks, "tick", 0.3],
  [T.later, "whoosh", 0.4],
  [T.yoyo, "swish", 0.35],
  [T.yoyo + 14, "swish", 0.3],
  [T.small, "page", 0.35],
  ...Array.from({ length: 3 }, (_, i): SfxCue => [T.steady + i * 8, "clink", 0.35]),
  [T.weekdays, "kaching", 0.4],
  [T.alarm, "horn", 0.25],
  [LOOP, "swirl", 0.35],
];

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN", "MON", "TUE"];
const CX0 = 120;
const CW = 70;
const CG = 6;
const CY = 720;
const cellX = (i: number) => CX0 + i * (CW + CG);

export const S01Bank: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // week strip
  const stripK = Math.max(win(f, 0, T.insulin, 6), win(f, T.protect - 4, T.before + 2, 6), win(f, LOOP + 4, VOICE_FRAMES + 30, 8));
  const steadyMode = f >= T.protect - 4 && f < LOOP;
  const shown = (i: number) => (steadyMode || f >= LOOP ? i < 7 : i < 7 || f >= T.monday + (i - 7) * 6);

  // piggy
  const pigK = Math.max(win(f, 0, T.insulin, 6), win(f, T.protect - 4, T.before + 4, 6), win(f, LOOP + 4, VOICE_FRAMES + 30, 8));
  const pigTilt = Math.sin(Math.max(0, f - T.nope) / 2) * interpolate(f, [T.nope, T.nope + 18], [8, 0], clamp) + Math.sin(Math.max(0, f - T.disagrees) / 2) * interpolate(f, [T.disagrees, T.disagrees + 18], [6, 0], clamp);
  const PX = 440;
  const SLOT_Y = GROUND - 310;

  // coin 1 (hook → bounce at "disagrees")
  const c1y =
    f < T.pays || f >= LOOP
      ? 560
      : f < T.disagrees - 6
        ? interpolate(f, [T.pays, T.disagrees - 6], [560, SLOT_Y - 50], { ...clamp, easing: Easing.in(Easing.quad) })
        : interpolate(f, [T.disagrees - 6, T.disagrees + 4, T.disagrees + 16], [SLOT_Y - 50, SLOT_Y - 220, GROUND - 62], clamp);
  const c1x = f < T.disagrees - 6 || f >= LOOP ? PX : interpolate(f, [T.disagrees - 6, T.disagrees + 16], [PX, PX - 260], clamp);
  const c1K = Math.max(win(f, 0, T.lab, 6), win(f, LOOP + 4, VOICE_FRAMES + 30, 8));
  // coins 2 (lie-in again → bounce at "fix")
  const c2K = win(f, T.did, T.insulin, 4);
  const c2y = interpolate(f, [T.did, T.fix - 2, T.fix + 8, T.nope + 8], [560, SLOT_Y - 50, SLOT_Y - 240, GROUND - 62], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const c2x = interpolate(f, [T.fix - 2, T.nope + 8], [PX, PX + 270], clamp);

  // gauge
  const gaugeK = win(f, T.insulin, T.snacked, 6);
  const needle = interpolate(f, [T.fell - 4, T.n27 + 6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const ang = -90 + 160 * (1 - needle * 0.27 * 2.6); // dramatised sweep; label carries the number

  // cookie + scale
  const snackK = win(f, T.snacked - 4, T.clocks - 2, 6);
  const scaleNeedle = interpolate(f, [T.gained, T.gained + 10], [-30, 30], { ...clamp, easing: Easing.out(Easing.back(2)) });

  // clock drifting later
  const clockK = win(f, T.clocks - 4, T.yoyo - 2, 6);
  const hands = interpolate(f, [T.clocks, T.later + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  // yo-yo
  const yoK = win(f, T.yoyo - 6, T.small + 2, 6);
  const yoY = 860 + (Math.cos(Math.max(0, f - T.yoyo + 6) / 6) * -1 + 1) * 170;

  // alarm (loop)
  const alarmK = interpolate(f, [T.before - 4, T.before + 6], [0, 1], clamp) * interpolate(f, [LOOP + 4, LOOP + 12], [1, 0], clamp);
  const ring = f >= T.alarm ? Math.sin(f * 1.6) * 9 : 0;

  // steady coins (payoff)
  const steadyCoin = (i: number) => {
    const at = T.steady + i * 8;
    return { y: interpolate(f, [at, at + 10], [880, SLOT_Y + 10], { ...clamp, easing: Easing.in(Easing.quad) }), k: f >= at && f < at + 11 ? 1 : 0 };
  };

  const sparkKeys = gestureKeys([
    [0, G.pointSide],
    [T.pays, G.present, "snap"],
    [T.disagrees, G.handsHips, "snap"],
    [T.lab, G.pointUp, "snap"],
    [T.five, G.count1, "snap"],
    [T.sleepIn, G.whisper, "snap"],
    [T.monday, G.facepalm, "snap"],
    [T.fix, G.shrugBig, "snap"],
    [T.nope, G.stop, "snap"],
    [T.insulin, G.thinkChin, "snap"],
    [T.sugar, G.pointSide, "snap"],
    [T.n27, G.mindBlown, "snap"],
    [T.snacked, G.pointDown, "snap"],
    [T.gained, G.recoil, "snap"],
    [T.clocks, G.pointUp, "snap"],
    [T.yoyo, { ...G.pointDown, ra1: 70 }, "snap"],
    [T.small, G.armsCrossed, "snap"],
    [T.protect, G.presentBoth, "snap"],
    [T.weekdays, G.celebrate, "snap"],
    [T.before, G.beckon, "snap"],
    [LOOP + 4, G.pointSide],
  ]);
  const sparkMood = (t: number): Mood =>
    t < T.body
      ? "smug"
      : t < T.lab
        ? "skeptical"
        : t < T.group
          ? "curious"
          : t < T.monday
            ? "happy"
            : t < T.did
              ? "sad"
              : t < T.insulin
                ? "angry"
                : t < T.n27
                  ? "thinking"
                  : t < T.snacked
                    ? "mindblown"
                    : t < T.clocks
                      ? "shock"
                      : t < T.yoyo
                        ? "curious"
                        : t < T.small
                          ? "worried"
                          : t < T.protect
                            ? "neutral"
                            : t < T.before
                              ? "excited"
                              : t < LOOP
                                ? "wink"
                                : "smug";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.n27, 32), bulbPulse(t, T.yoyo, 26) * 0.8);

  const z = punch(f, [T.disagrees, T.nope, T.n27, T.gained], 0.035);
  const hookK = Math.max(interpolate(f, [T.body - 4, T.body + 2], [1, 0], clamp), interpolate(f, [LOOP + 2, LOOP + 10], [0, 1], clamp));

  const GX = 430;
  const GY = 1180;
  const GR = 250;
  const rad = (a: number) => (a * Math.PI) / 180;

  return (
    <Stage
      bg={<Bank f={f} />}
      hits={[T.disagrees, T.nope, T.n27]}
      power={9}
      cam={{ z }}
      svg={
        <>
          {/* piggy */}
          {pigK > 0.01 && (
            <g opacity={pigK}>
              <Piggy x={PX} k={1} tilt={pigTilt} happy={f >= T.protect && f < LOOP} />
            </g>
          )}
          <Coin x={c1x} y={c1y} label="LIE-IN" k={c1K * 1.3} r={f > T.disagrees - 6 && f < LOOP ? (f - T.disagrees) * 14 : 0} />
          {c2K > 0.01 && (
            <>
              <Coin x={c2x - 70} y={c2y} label="SAT" k={c2K} r={f > T.fix ? (f - T.fix) * -12 : 0} />
              <Coin x={c2x + 70} y={c2y - 20} label="SUN" k={c2K} r={f > T.fix ? (f - T.fix) * 12 : 0} />
            </>
          )}
          {[0, 1, 2].map((i) => {
            const c = steadyCoin(i);
            return <Coin key={i} x={PX} y={c.y} label="WEEKDAY" k={c.k} col="#9fe3bf" />;
          })}

          {/* gauge */}
          {gaugeK > 0.01 && (
            <g opacity={gaugeK}>
              <path d={`M ${GX - GR} ${GY} A ${GR} ${GR} 0 0 1 ${GX + GR} ${GY}`} fill="#fff" {...K} />
              {[
                [-90, -54, RED],
                [-54, -18, "#ffb238"],
                [-18, 90, MINT],
              ].map(([a0, a1, col]) => {
                const r = GR - 30;
                const p0 = [GX + r * Math.sin(rad(a0 as number)), GY - r * Math.cos(rad(a0 as number))];
                const p1 = [GX + r * Math.sin(rad(a1 as number)), GY - r * Math.cos(rad(a1 as number))];
                return <path key={col as string} d={`M ${p0[0]} ${p0[1]} A ${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`} fill="none" stroke={col as string} strokeWidth={34} />;
              })}
              <line x1={GX - GR} y1={GY} x2={GX + GR} y2={GY} stroke={COL.ink} strokeWidth={6} />
              <g transform={`translate(${GX} ${GY}) rotate(${ang})`}>
                <path d="M -12 0 L 0 -210 L 12 0 Z" fill={COL.ink} />
              </g>
              <circle cx={GX} cy={GY} r={20} fill={INDIGO} {...K} strokeWidth={5} />
              {/* sugar cube */}
              <g transform={`translate(${GX + 330} ${GY - 230}) scale(${f >= T.sugar ? pop(f, T.sugar) : 0})`}>
                <rect x={-34} y={-34} width={68} height={68} rx={8} fill="#fff" {...K} strokeWidth={5} />
                <circle cx={-12} cy={-10} r={4} fill="#c9cdd6" />
                <circle cx={10} cy={8} r={4} fill="#c9cdd6" />
              </g>
              {f >= T.n27 && f < T.n27 + 16 && <Burst x={GX} y={GY - 140} at={T.n27} f={f} size={300} color={RED} />}
            </g>
          )}

          {/* cookie + bathroom scale */}
          {snackK > 0.01 && (
            <g opacity={snackK}>
              <g transform={`translate(260 1000) scale(${pop(f, T.snacked)}) rotate(${Math.sin(f / 8) * 6})`}>
                <circle r={90} fill="#d99a52" {...K} />
                {[
                  [-30, -30],
                  [28, -18],
                  [-6, 30],
                  [40, 34],
                  [-44, 18],
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={11} fill="#5a3418" />
                ))}
                <path d="M 60 -66 A 90 90 0 0 1 90 0 L 50 -10 Z" fill="#d6caff" />
              </g>
              <g transform={`translate(600 ${GROUND}) scale(${f >= T.gained - 4 ? pop(f, T.gained - 4) : 0})`}>
                <rect x={-130} y={-60} width={260} height={60} rx={18} fill="#fff" {...K} />
                <path d="M -60 -44 A 60 60 0 0 1 60 -44" fill="#eef" {...K} strokeWidth={4} />
                <g transform={`translate(0 -14) rotate(${scaleNeedle})`}>
                  <line x1={0} y1={0} x2={0} y2={-44} stroke={RED} strokeWidth={6} />
                </g>
              </g>
            </g>
          )}

          {/* clock drifting later */}
          {clockK > 0.01 && (
            <g opacity={clockK} transform={`translate(430 1020) scale(${pop(f, T.clocks - 4)})`}>
              <circle r={190} fill="#fff" {...K} strokeWidth={8} />
              {Array.from({ length: 12 }, (_, i) => (
                <line key={i} x1={0} y1={-160} x2={0} y2={-140} stroke={COL.ink} strokeWidth={8} transform={`rotate(${i * 30})`} />
              ))}
              <line x1={0} y1={0} x2={0} y2={-110} stroke={COL.ink} strokeWidth={12} strokeLinecap="round" transform={`rotate(${300 + hands * 60})`} />
              <line x1={0} y1={0} x2={0} y2={-150} stroke={INDIGO} strokeWidth={8} strokeLinecap="round" transform={`rotate(${hands * 720})`} />
              <circle r={14} fill={COL.ink} />
            </g>
          )}

          {/* yo-yo */}
          {yoK > 0.01 && (
            <g opacity={yoK}>
              <line x1={430} y1={700} x2={430} y2={yoY} stroke={COL.ink} strokeWidth={5} />
              <g transform={`translate(430 ${yoY}) rotate(${f * 12})`}>
                <circle r={80} fill={INDIGO} {...K} />
                <circle r={26} fill="#fff" {...K} strokeWidth={5} />
                <line x1={-80} y1={0} x2={80} y2={0} stroke="#fff" strokeWidth={6} opacity={0.5} />
              </g>
              <g transform="translate(220 860)">
                <rect x={-80} y={-36} width={160} height={72} rx={16} fill={RED} {...K} strokeWidth={5} />
                <text y={18} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill="#fff">
                  5h
                </text>
              </g>
              <g transform="translate(220 1200)">
                <rect x={-100} y={-36} width={200} height={72} rx={16} fill={MINT} {...K} strokeWidth={5} />
                <text y={18} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill="#fff">
                  LIE-IN
                </text>
              </g>
            </g>
          )}

          {/* 36 volunteers (caveat) */}
          {f >= T.small - 4 && f < T.protect && (
            <g opacity={interpolate(f, [T.protect - 8, T.protect - 2], [1, 0], clamp)}>
              {Array.from({ length: 36 }, (_, i) => {
                const k = pop(f, T.n36 - 10 + i * 0.8);
                const x = 170 + (i % 9) * 70;
                const y = 880 + Math.floor(i / 9) * 100;
                return (
                  <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
                    <circle cy={-30} r={18} fill="#fff" {...K} strokeWidth={4} />
                    <path d="M -24 30 Q 0 -10 24 30 Z" fill={INDIGO} {...K} strokeWidth={4} />
                  </g>
                );
              })}
            </g>
          )}

          {/* Monday alarm (loop) */}
          {alarmK > 0.01 && (
            <g opacity={alarmK} transform={`translate(${PX} ${GROUND - 470}) rotate(${ring}) scale(${0.6 + 0.4 * alarmK})`}>
              <circle cx={-110} cy={-150} r={50} fill={COIN} {...K} />
              <circle cx={110} cy={-150} r={50} fill={COIN} {...K} />
              <circle r={170} fill={RED} {...K} strokeWidth={8} />
              <circle r={135} fill="#fff" {...K} strokeWidth={5} />
              <text y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={96} fill={COL.ink}>
                MON
              </text>
            </g>
          )}

          {/* SPARK (right side, facing left) */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 905, y: SGY }}
            facing={-1}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={-1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 5));
              q = addPose(addPose(q, hop(t, T.sleepIn, 30)), hop(t, T.weekdays, 44));
              q = addPose(addPose(q, shake(t, T.nope)), nod(t, T.protect));
              return q;
            }}
          />
        </>
      }
      html={
        <>
          {/* week strip */}
          {stripK > 0.01 && (
            <div style={{ position: "absolute", left: 0, top: 0, opacity: stripK }}>
              {DAYS.map((d, i) => {
                if (!shown(i)) return null;
                const lie = !steadyMode && (i === 5 || i === 6);
                const k = i >= 7 && !steadyMode ? pop(f, T.monday + (i - 7) * 6) : steadyMode ? pop(f, T.protect - 4 + i * 2) : 1;
                const pulse = !steadyMode && i < 5 && f >= T.five + i * 4 && f < T.five + i * 4 + 8 ? 1.12 : 1;
                const lit = lie && f >= T.sleepIn && f < LOOP;
                const bg = steadyMode ? MINT : lie ? (lit ? MINT : "#fff") : RED;
                const val = steadyMode ? "✓" : lie ? (lit ? "zzz" : "?") : "5h";
                return (
                  <div key={i} style={{ position: "absolute", left: cellX(i), top: CY, width: CW, transform: `scale(${k * pulse})`, textAlign: "center", fontFamily: FONT.title, fontWeight: 900 }}>
                    <div style={{ fontSize: 26, color: COL.ink, letterSpacing: 1 }}>{d}</div>
                    <div style={{ height: 76, borderRadius: 12, border: `5px solid ${COL.ink}`, background: bg, color: lie && !lit ? COL.ink : "#fff", fontFamily: FONT.comic, fontSize: val === "zzz" ? 30 : 40, lineHeight: "70px" }}>{val}</div>
                  </div>
                );
              })}
            </div>
          )}
          {/* hook overlay (frame 1 + loop) */}
          {hookK > 0.01 && (
            <div style={{ position: "absolute", left: 470, top: 440, transform: "translate(-50%,-50%) rotate(-3deg)", opacity: hookK, background: COL.ink, color: "#fff", borderRadius: 20, padding: "10px 40px", fontFamily: FONT.comic, fontSize: 124, letterSpacing: 4, lineHeight: 1, whiteSpace: "nowrap" }}>
              SLEEP DEBT: <span style={{ color: COIN }}>PAID?</span>
            </div>
          )}
          {f >= T.disagrees && f < T.lab && <Stamp f={f} at={T.disagrees} x={470} y={440} text="MYTH" size={140} color={RED} r={-8} />}
          <Slam f={f} at={T.lab} out={T.group - 4} x={470} y={440} size={100} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            SLEEP LAB: 5h NIGHTS
          </Slam>
          <Slam f={f} at={T.sleepIn} out={T.monday - 4} x={470} y={440} size={110} color={MINT} stroke={`9px ${COL.ink}`} rotate={2}>
            WEEKEND LIE-IN
          </Slam>
          <Slam f={f} at={T.monday} out={T.did - 4} x={470} y={440} size={110} color={RED} stroke={`9px #fff`} rotate={-2}>
            MONDAY: 5h AGAIN
          </Slam>
          <Slam f={f} at={T.nope} out={T.insulin - 2} x={470} y={440} size={170} color={RED} stroke={`12px ${COL.ink}`} rotate={-4}>
            NOPE.
          </Slam>
          {f >= T.insulin && f < T.snacked && (
            <div style={{ position: "absolute", left: 470, top: 420, transform: `translate(-50%,-50%)`, textAlign: "center" }}>
              <div style={{ transform: `scale(${pop(f, T.insulin)})`, fontFamily: FONT.title, fontWeight: 900, fontSize: 58, color: "#fff", background: INDIGO, borderRadius: 14, padding: "4px 22px", whiteSpace: "nowrap" }}>INSULIN SENSITIVITY</div>
              <div style={{ marginTop: 8, fontFamily: FONT.title, fontWeight: 800, fontSize: 40, color: COL.ink, opacity: f >= T.sugar - 6 ? 1 : 0 }}>= how well you handle sugar</div>
              {f >= T.n27 && (
                <div style={{ marginTop: 14, transform: `scale(${pop(f, T.n27)}) rotate(-3deg)` }}>
                  <div style={{ fontFamily: FONT.comic, fontSize: 150, color: RED, WebkitTextStroke: `12px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 1, whiteSpace: "nowrap" }}>UP TO −27%</div>
                  <div style={{ fontFamily: FONT.title, fontWeight: 800, fontSize: 34, color: COL.ink, whiteSpace: "nowrap" }}>LIE-IN GROUP · 9–27% DROP (LIVER &amp; MUSCLE)</div>
                </div>
              )}
            </div>
          )}
          <Slam f={f} at={T.snacked} out={T.gained - 2} x={470} y={440} size={96} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            AFTER-DINNER SNACKS ↑
          </Slam>
          <Slam f={f} at={T.gained} out={T.clocks - 4} x={470} y={440} size={110} color={RED} stroke={`9px #fff`} rotate={2}>
            WEIGHT ↑
          </Slam>
          <Slam f={f} at={T.clocks} out={T.yoyo - 4} x={470} y={440} size={100} color={INDIGO} stroke={`9px #fff`} rotate={-2}>
            BODY CLOCK → LATER
          </Slam>
          <Slam f={f} at={T.yoyo} out={T.small - 4} x={470} y={440} size={110} color="#fff" stroke={`9px ${COL.ink}`} rotate={2}>
            THE YO-YO?
          </Slam>
          {f >= T.small && f < T.protect && (
            <div style={{ position: "absolute", left: 480, top: 440, transform: `translate(-50%,-50%) scale(${pop(f, T.small)}) rotate(-2deg)`, fontFamily: FONT.title, fontWeight: 900, fontSize: 42, color: "#fff", background: COL.ink, borderRadius: 16, padding: "8px 22px", whiteSpace: "nowrap", opacity: interpolate(f, [T.protect - 6, T.protect], [1, 0], clamp) }}>
              CAVEAT: SMALL LAB STUDY · 36 ADULTS · 2 WEEKS
            </div>
          )}
          <Slam f={f} at={T.protect} out={T.before - 4} x={470} y={440} size={96} color={MINT} stroke={`9px ${COL.ink}`} rotate={-2}>
            STEADY SLEEP WINDOW
          </Slam>
          {/* health line + source */}
          <div style={{ position: "absolute", left: 540, top: 1690, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 25, color: "#5a3a2a", whiteSpace: "nowrap", background: "rgba(255,255,255,0.65)", borderRadius: 10, padding: "2px 12px" }}>
            Depner et al. 2019, Current Biology · n = 36 · 2-week lab study
          </div>
          <div style={{ position: "absolute", left: 540, top: 1736, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 800, fontSize: 26, color: COL.ink, whiteSpace: "nowrap" }}>
            Education, not medical advice
          </div>
          <VoiceCaptions f={f} y={1480} cues={VOICE_CUES} hi={["lie-in", "five-hour", "disagrees", "five", "weekend", "monday", "nope", "insulin", "sugar", "twenty-seven", "snacked", "weight", "later", "yo-yo", "small", "thirty-six", "steady", "weekdays", "alarm"]} />
        </>
      }
    />
  );
};
