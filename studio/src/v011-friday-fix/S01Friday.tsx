import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, type Key } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V011 · POV: Friday 5 PM "quick fix". POV Meme in a dusk office.
// Desk scene: wall clock ticks 4:59 → 5:00, YOU (orange) types a one-line diff and ships it. Hard cut to a
// row of growing dominoes (1 LINE → LOGIN → PAYMENTS → PAGER → SATURDAY → SUNDAY) that topple on the spoken
// words while the window flips day/night. "The fix was one line" spotlights the tiny domino; "the weekend
// was all of it" the giant ones. On "Ship it Monday" the dominoes rewind upright and we cut back to the
// desk, where a SHIP MONDAY sticky note slaps on the laptop. The clock goes back to 4:59 (loop).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);

const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const YS = 1.55;
const YGY = GROUND - 92.5 * YS;
const SUNSET = ["#ff9a5a", "#ffcf7a"];
const NIGHT = ["#1d2452", "#3a3f78"];
const DAY = ["#6cc6ff", "#c8ecff"];
const MORNING = ["#8fd3ff", "#fff1c4"];
const STICKY = "#ffe066";

// timing anchors (global frames; the video is a single scene starting at 0)
const T = {
  five: W(0, 5),
  why: C(1),
  oneLine: C(2),
  ship: W(2, 2),
  home: W(2, 4),
  dom: C(3),
  login: W(3, 2),
  pay: W(4, 2),
  pager: W(4, 5),
  sat: W(5, 0),
  satGone: W(5, 1),
  sun: W(5, 2),
  sunGone: W(5, 3),
  fixLine: C(6),
  weekend: C(7),
  friday: C(8),
  shipMon: W(8, 2),
  monday: W(8, 4),
};
const BACK = T.shipMon - 4; // cut back to the desk after the rewind
const LOOP = VOICE_FRAMES - 16; // clock rolls back to 4:59

// dominoes: x = centre, h/w size, falls on frame `at`
const DOM = [
  { x: 300, w: 34, h: 92, label: "1 LINE", at: T.dom + 6 },
  { x: 380, w: 50, h: 140, label: "LOGIN", at: T.login },
  { x: 482, w: 62, h: 220, label: "PAYMENTS", at: T.pay },
  { x: 614, w: 74, h: 310, label: "PAGER", at: T.pager },
  { x: 776, w: 88, h: 410, label: "SATURDAY", at: T.sat },
  { x: 932, w: 98, h: 510, label: "SUNDAY", at: T.sun },
];
const restAngle = (i: number) => {
  if (i === DOM.length - 1) return 88;
  const a = DOM[i];
  const b = DOM[i + 1];
  const gap = b.x - b.w / 2 - (a.x + a.w / 2);
  return (Math.asin(Math.min(1, gap / a.h)) * 180) / Math.PI;
};
const REWIND0 = T.friday + 2;
const REWIND1 = T.shipMon - 6;

const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
};

// sky over time: sunset → night → (sat) day/night → (sun) day/night → night → morning → sunset (loop)
const sky = (f: number): [string, string] => {
  const stops: [number, string[]][] = [
    [0, SUNSET],
    [T.dom, SUNSET],
    [T.dom + 18, NIGHT],
    [T.sat - 2, NIGHT],
    [T.sat + 4, DAY],
    [T.satGone, DAY],
    [T.satGone + 6, NIGHT],
    [T.sun - 2, NIGHT],
    [T.sun + 4, DAY],
    [T.sunGone, DAY],
    [T.sunGone + 6, NIGHT],
    [T.monday - 4, NIGHT],
    [T.monday + 4, MORNING],
    [LOOP, MORNING],
    [LOOP + 10, SUNSET],
  ];
  let i = 0;
  while (i < stops.length - 2 && f >= stops[i + 1][0]) i++;
  const [f0, c0] = stops[i];
  const [f1, c1] = stops[i + 1];
  const k = interpolate(f, [f0, f1], [0, 1], clamp);
  return [mix(c0[0], c1[0], k), mix(c0[1], c1[1], k)];
};
const darkness = (f: number) => {
  const [top] = sky(f);
  const v = top.match(/\d+/g)!.map(Number);
  const lum = (0.3 * v[0] + 0.59 * v[1] + 0.11 * v[2]) / 255;
  return interpolate(lum, [0.2, 0.7], [0.32, 0], clamp);
};

// --- background: office wall, window, wall clock, floor --------------------------------------
const Office: React.FC<{ f: number }> = ({ f }) => {
  const [s0, s1] = sky(f);
  const isDay = (f >= T.sat + 2 && f < T.satGone + 3) || (f >= T.sun + 2 && f < T.sunGone + 3);
  const isNight = f >= T.dom + 10 && !isDay && f < T.monday;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="v11sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s0} />
            <stop offset="100%" stopColor={s1} />
          </linearGradient>
        </defs>
        <rect width={1080} height={1920} fill="#d9d2e6" />
        {/* wainscot stripes */}
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={i * 96} y={0} width={48} height={GROUND} fill="#cfc7de" opacity={0.6} />
        ))}
        {/* window */}
        <rect x={470} y={270} width={500} height={370} rx={14} fill="url(#v11sky)" {...K} strokeWidth={9} />
        {/* city skyline silhouette, lights on at night */}
        <path d="M 474 640 L 474 560 L 530 560 L 530 520 L 590 520 L 590 575 L 640 575 L 640 480 L 700 480 L 700 548 L 760 548 L 760 500 L 830 500 L 830 565 L 880 565 L 880 530 L 966 530 L 966 640 Z" fill={isNight ? "#141a3a" : "#7b6f99"} opacity={0.9} />
        {isNight &&
          Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={490 + ((i * 37) % 460)} y={540 + ((i * 23) % 80)} width={10} height={14} fill="#ffe28a" opacity={(i + Math.floor(f / 9)) % 4 === 0 ? 0.3 : 0.9} />
          ))}
        {isDay && <circle cx={880} cy={350} r={42} fill="#ffe066" stroke="#f5b700" strokeWidth={6} />}
        {isNight && <circle cx={880} cy={340} r={30} fill="#f4f1ff" />}
        {f < T.dom + 10 && <circle cx={620} cy={500} r={56} fill="#ff6f3c" opacity={0.85} />}
        <line x1={720} y1={270} x2={720} y2={640} stroke={COL.ink} strokeWidth={8} />
        <line x1={470} y1={455} x2={970} y2={455} stroke={COL.ink} strokeWidth={8} />
        {/* floor */}
        <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#b98a5e" />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={i * 140} y1={GROUND} x2={i * 140 - 120} y2={1920} stroke="#a3784f" strokeWidth={4} />
        ))}
        <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
      </svg>
    </AbsoluteFill>
  );
};

const Clock: React.FC<{ f: number }> = ({ f }) => {
  // minutes since 4:00
  const spinning = f >= T.dom && f < T.fixLine;
  const min =
    f >= LOOP
      ? interpolate(f, [LOOP, LOOP + 8], [60, 59], clamp)
      : f < T.five
        ? 59
        : !spinning && f < T.dom
          ? 60
          : spinning
            ? 60 + (f - T.dom) * 9
            : f >= T.monday
              ? 60 + 17 * 60
              : 60 + (T.fixLine - T.dom) * 9;
  const mAng = (min % 60) * 6;
  const hAng = ((4 + min / 60) % 12) * 30;
  const tick = f >= T.five && f < T.five + 8 ? interpolate(f - T.five, [0, 3, 8], [1, 1.1, 1], clamp) : 1;
  const day = f < T.sat ? "FRI" : f < T.sun ? "SAT" : f < T.monday ? "SUN" : f < LOOP ? "MON" : "FRI";
  const digital = f < T.five || f >= LOOP + 6 ? "4:59 PM" : f < T.dom ? "5:00 PM" : day === "MON" ? "9:00 AM" : "";
  return (
    <g transform={`translate(270 420) scale(${tick})`}>
      <circle r={118} fill="#fff" {...K} strokeWidth={9} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.sin(a) * 92} y1={-Math.cos(a) * 92} x2={Math.sin(a) * 106} y2={-Math.cos(a) * 106} stroke={COL.ink} strokeWidth={i % 3 === 0 ? 8 : 4} />;
      })}
      <line x1={0} y1={0} x2={Math.sin((hAng * Math.PI) / 180) * 54} y2={-Math.cos((hAng * Math.PI) / 180) * 54} stroke={COL.ink} strokeWidth={11} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.sin((mAng * Math.PI) / 180) * 84} y2={-Math.cos((mAng * Math.PI) / 180) * 84} stroke={COL.red} strokeWidth={7} strokeLinecap="round" />
      <circle r={9} fill={COL.ink} />
      {/* day plaque */}
      <g transform="translate(0 168)">
        <rect x={-150} y={-34} width={300} height={68} rx={14} fill={COL.ink} />
        <text y={16} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={day === "FRI" ? "#ffcf7a" : day === "MON" ? "#8ce99a" : "#ff8787"} letterSpacing={3}>
          {digital ? `${day} ${digital}` : day}
        </text>
      </g>
    </g>
  );
};

// --- desk + laptop -----------------------------------------------------------------------------
const Desk: React.FC<{ f: number; typed: number; shipped: boolean; note: number }> = ({ f, typed, shipped, note }) => (
  <g>
    {/* laptop (screen faces the camera) */}
    <g transform="translate(560 1010)">
      <rect x={-170} y={-210} width={340} height={220} rx={16} fill="#2b2f3a" {...K} />
      <rect x={-150} y={-192} width={300} height={182} rx={8} fill="#141821" />
      <text x={-134} y={-156} fontFamily="monospace" fontSize={22} fill="#8a93a8">
        fix.js · 1 line
      </text>
      <rect x={-140} y={-130} width={280} height={34} fill="#4a1f25" />
      <text x={-132} y={-104} fontFamily="monospace" fontWeight={700} fontSize={26} fill="#ff8787">
        - if (x &gt; 0)
      </text>
      <rect x={-140} y={-90} width={280 * typed} height={34} fill="#1f4a2c" />
      <text x={-132} y={-64} fontFamily="monospace" fontWeight={700} fontSize={26} fill="#8ce99a">
        {"+ if (x >= 0)".slice(0, Math.round(typed * 13))}
      </text>
      {shipped && (
        <g transform={`translate(0 -32) scale(${pop(f, T.ship)})`}>
          <rect x={-104} y={-18} width={208} height={40} rx={20} fill="#2fa84f" stroke="#fff" strokeWidth={3} />
          <text y={11} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={26} fill="#fff">
            DEPLOYED ✓
          </text>
        </g>
      )}
      <path d="M -200 10 L 200 10 L 220 34 L -220 34 Z" fill="#9aa3b5" {...K} />
      {note > 0.01 && (
        <g transform={`translate(96 -150) rotate(8) scale(${note})`}>
          <rect x={-92} y={-70} width={184} height={150} fill={STICKY} {...K} strokeWidth={5} />
          <text y={-8} textAnchor="middle" fontFamily={FONT.comic} fontSize={44} fill={COL.ink}>
            SHIP
          </text>
          <text y={46} textAnchor="middle" fontFamily={FONT.comic} fontSize={44} fill={COL.red}>
            MONDAY
          </text>
        </g>
      )}
    </g>
    {/* desk */}
    <rect x={330} y={1044} width={680} height={34} rx={6} fill="#8a5a3b" {...K} />
    <rect x={360} y={1078} width={26} height={212} fill="#6e462d" {...K} />
    <rect x={954} y={1078} width={26} height={212} fill="#6e462d" {...K} />
    {/* mug */}
    <g transform="translate(880 1004)">
      <rect x={-26} y={-34} width={52} height={74} rx={8} fill="#fff" {...K} strokeWidth={5} />
      <path d="M 26 -18 Q 50 -12 26 18" fill="none" stroke={COL.ink} strokeWidth={5} />
    </g>
  </g>
);

// --- a domino ------------------------------------------------------------------------------------
const Domino: React.FC<{ i: number; ang: number; lit: number }> = ({ i, ang, lit }) => {
  const d = DOM[i];
  const px = d.x + d.w / 2;
  const fs = Math.min(d.w * 0.62, 66);
  return (
    <g transform={`rotate(${ang} ${px} ${GROUND})`}>
      {lit > 0.01 && <rect x={d.x - d.w / 2 - 16} y={GROUND - d.h - 16} width={d.w + 32} height={d.h + 32} rx={20} fill="#ffe066" opacity={0.55 * lit} />}
      <rect x={d.x - d.w / 2} y={GROUND - d.h} width={d.w} height={d.h} rx={Math.min(14, d.w / 4)} fill={i === 0 ? "#fff8d6" : "#ffffff"} {...K} />
      <line x1={d.x - d.w / 2 + 6} y1={GROUND - d.h / 2} x2={d.x + d.w / 2 - 6} y2={GROUND - d.h / 2} stroke={COL.ink} strokeWidth={4} />
      {i > 0 && (
        <text
          transform={`translate(${d.x + fs * 0.34} ${GROUND - d.h / 2}) rotate(-90)`}
          textAnchor="middle"
          fontFamily={FONT.title}
          fontWeight={900}
          fontSize={fs}
          fill={i >= 4 ? COL.red : COL.ink}
          letterSpacing={2}
        >
          {d.label}
        </text>
      )}
      {i === 0 && (
        <>
          <circle cx={d.x} cy={GROUND - d.h * 0.75} r={5} fill={COL.ink} />
          <circle cx={d.x} cy={GROUND - d.h * 0.25} r={5} fill={COL.ink} />
        </>
      )}
    </g>
  );
};

// --- sfx --------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "tick", 0.35],
  [T.five, "ding", 0.45],
  [T.why, "boing", 0.35],
  ...[0, 3, 6, 9].map((k): SfxCue => [T.oneLine + 4 + k, "tick", 0.3]),
  [T.ship, "pop", 0.55],
  [T.home, "kaching", 0.35],
  [T.dom, "whoosh", 0.5],
  [DOM[0].at + 6, "clink", 0.45],
  [DOM[1].at + 6, "thud", 0.45],
  [DOM[2].at + 6, "thud", 0.55],
  [DOM[3].at, "buzz", 0.45],
  [DOM[3].at + 6, "impact", 0.5],
  [DOM[4].at + 6, "impact", 0.6],
  [DOM[5].at + 8, "crash", 0.7],
  [T.fixLine, "ding", 0.4],
  [T.weekend, "slam", 0.55],
  [REWIND0, "swirl", 0.5],
  [BACK, "whoosh", 0.45],
  [T.monday, "stamp", 0.6],
  [LOOP, "tick", 0.35],
];

export const S01Friday: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const desk = f < T.dom || f >= BACK;

  // domino angles (fall on their words, rewind upright on "Friday fix?")
  const angle = (i: number) => {
    const d = DOM[i];
    const fall = interpolate(f, [d.at, d.at + (i === 5 ? 12 : 9)], [0, restAngle(i)], { ...clamp, easing: Easing.in(Easing.quad) });
    const back = interpolate(f, [REWIND0 + (5 - i) * 2, REWIND1 - i], [1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
    return fall * back;
  };
  const domIn = (i: number) => interpolate(f, [T.dom + i * 1.5, T.dom + i * 1.5 + 6], [0, 1], clamp);
  const litSmall = interpolate(f, [T.fixLine, T.fixLine + 6, T.weekend - 4, T.weekend], [0, 1, 1, 0], clamp);
  const litBig = interpolate(f, [T.weekend, T.weekend + 6, T.friday - 2, T.friday + 4], [0, 1, 1, 0], clamp);

  // YOU (orange dev) behind the desk
  const youKeys: Key[] = [
    { f: 0, p: { ra1: 60, ra2: 40, la1: -60, la2: -40 } },
    { f: T.oneLine - 2, p: { ra1: 60, ra2: 40, la1: -60, la2: -40 } },
    { f: T.oneLine + 4, p: { ra1: 75, ra2: 50, la1: -75, la2: -50 } },
    { f: T.ship - 3, p: { ra1: 75, ra2: 50, la1: -75, la2: -50 } },
    { f: T.ship + 2, p: { ra1: 85, ra2: -10, la1: -20, la2: 10 }, e: SNAP },
    { f: T.home - 2, p: { ra1: 85, ra2: -10, la1: -20, la2: 10 } },
    { f: T.home + 3, p: { ...P.cheer }, e: SNAP },
    { f: BACK, p: { ...P.facepalm } },
    { f: T.monday - 3, p: { ...P.facepalm } },
    { f: T.monday + 3, p: { ...G.fistPump }, e: SNAP },
  ];
  const typed = interpolate(f, [T.oneLine + 2, T.ship - 4], [0, 1], clamp);

  // SPARK: a gesture + mood on every line
  const sparkKeys = gestureKeys([
    [0, G.present],
    [T.five, G.pointUp, "snap"],
    [T.why, G.handsHips, "snap"],
    [T.oneLine, G.count1, "snap"],
    [T.home, G.shrugBig, "snap"],
    [T.dom, G.recoil, "snap"],
    [T.pay, G.pointSide],
    [T.pager, G.stop, "snap"],
    [T.sat, G.mindBlown, "snap"],
    [T.fixLine, { ...G.pointSide, ra1: 70 }, "snap"],
    [T.weekend, G.facepalm, "snap"],
    [T.friday, G.thinkChin],
    [T.shipMon, G.pointUp, "snap"],
    [T.monday + 6, G.celebrate, "snap"],
    [LOOP + 2, G.present],
  ]);
  const sparkMood = (t: number): Mood =>
    t < T.five
      ? "smug"
      : t < T.why
        ? "curious"
        : t < T.oneLine
          ? "skeptical"
          : t < T.dom
            ? "worried"
            : t < T.pager
              ? "shock"
              : t < T.fixLine
                ? "mindblown"
                : t < T.weekend
                  ? "thinking"
                  : t < T.friday
                    ? "sad"
                    : t < T.monday
                      ? "determined"
                      : t < LOOP
                        ? "wink"
                        : "smug";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.shipMon, 36), bulbPulse(t, T.fixLine, 16) * 0.6);

  const z = punch(f, [T.five, T.ship, T.sat, T.sun, T.weekend, T.monday], 0.035);
  const hookK = Math.max(interpolate(f, [T.why - 6, T.why], [1, 0], clamp), interpolate(f, [LOOP + 4, LOOP + 12], [0, 1], clamp));
  const dim = darkness(f);

  return (
    <Stage
      bg={<Office f={f} />}
      hits={[DOM[3].at + 6, DOM[4].at + 6, DOM[5].at + 8, T.monday]}
      power={12}
      cam={{ z }}
      svg={
        <>
          <Clock f={f} />
          {desk && (
            <>
              <Actor
                f={f}
                color={COL.orange}
                scale={YS}
                label="YOU"
                face={f >= BACK && f < T.monday ? "sad" : f >= T.ship ? "happy" : "eyes"}
                base={{ x: 800, y: YGY }}
                facing={-1}
                keys={youKeys}
                mod={(t, p) => addPose(addPose(p, idle(t, 4)), hop(t, T.home, 30))}
              />
              <Desk f={f} typed={typed} shipped={f >= T.ship && f < T.dom} note={f >= T.monday ? pop(f, T.monday) : 0} />
            </>
          )}
          {!desk &&
            DOM.map((d, i) => {
              const k = domIn(i);
              if (k < 0.02) return null;
              return (
                <g key={i} opacity={k}>
                  <Domino i={i} ang={angle(i)} lit={i === 0 ? litSmall : i >= 4 ? litBig : 0} />
                </g>
              );
            })}
          {!desk && f >= DOM[5].at + 8 && f < DOM[5].at + 24 && <Burst x={1000} y={GROUND - 30} at={DOM[5].at + 8} f={f} size={260} color={COL.red} />}
          {!desk && f >= DOM[3].at && f < DOM[3].at + 20 && (
            <g opacity={interpolate(f, [DOM[3].at, DOM[3].at + 3, DOM[3].at + 16, DOM[3].at + 20], [0, 1, 1, 0], clamp)}>
              <text x={DOM[3].x - 10} y={GROUND - DOM[3].h - 30 + Math.sin(f) * 4} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill={COL.red} stroke="#fff" strokeWidth={8} paintOrder="stroke">
                BEEP!
              </text>
            </g>
          )}
          {/* 1 LINE tag sits above the tiny first domino */}
          {!desk && (
            <g transform={`translate(300 ${GROUND - 160}) scale(${pop(f, DOM[0].at - 4) * (1 + litSmall * 0.25)})`}>
              <rect x={-74} y={-30} width={148} height={60} rx={30} fill={litSmall > 0.2 ? "#ffe066" : "#fff"} {...K} strokeWidth={5} />
              <text y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={COL.ink}>
                1 LINE
              </text>
            </g>
          )}
          {/* darkness wash at night */}
          <rect width={1080} height={1920} fill="#0b1030" opacity={dim * 0.6} />
          <Spark
            f={f}
            scale={SS}
            base={{ x: 150, y: SGY }}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => addPose(addPose(addPose(p, idle(t, 8)), nod(t, T.five)), shake(t, T.weekend, 3))}
          />
        </>
      }
      html={
        <>
          {/* hook overlay: readable muted at frame 0, returns at the loop point */}
          {hookK > 0.01 && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 740,
                transform: `translate(-50%,-50%) rotate(-3deg) scale(${0.96 + hookK * 0.04})`,
                opacity: hookK,
                background: COL.ink,
                color: "#fff",
                borderRadius: 18,
                padding: "10px 38px",
                fontFamily: FONT.comic,
                fontSize: 104,
                letterSpacing: 3,
                whiteSpace: "nowrap",
              }}
            >
              JUST A QUICK FIX.
            </div>
          )}
          <Slam f={f} at={T.why} out={T.oneLine - 6} x={540} y={740} size={96} color="#ffcf7a" stroke={`9px ${COL.ink}`} rotate={-2}>
            COST: 2 DAYS?
          </Slam>
          <Slam f={f} at={T.home} out={T.dom - 2} x={540} y={740} size={100} color="#fff" stroke={`9px ${COL.ink}`} rotate={2}>
            HOME BY 6 :)
          </Slam>
          {f >= T.satGone && f < T.sun && <Stamp f={f} at={T.satGone} x={600} y={760} text="GONE" size={92} color={COL.red} r={-8} />}
          {f >= T.sunGone && f < T.fixLine && <Stamp f={f} at={T.sunGone} x={600} y={760} text="GONE" size={92} color={COL.red} r={6} />}
          <Slam f={f} at={T.fixLine} out={T.weekend - 4} x={540} y={740} size={100} color="#ffe066" stroke={`9px ${COL.ink}`} rotate={-3}>
            THE FIX: 1 LINE
          </Slam>
          <Slam f={f} at={T.weekend} out={T.friday - 2} x={540} y={740} size={96} color="#ff8787" stroke={`9px ${COL.ink}`} rotate={3}>
            THE COST: 2 DAYS
          </Slam>
          <Slam f={f} at={T.shipMon} out={LOOP - 8} x={540} y={740} size={108} color="#8ce99a" stroke={`9px ${COL.ink}`} rotate={-3}>
            SHIP IT MONDAY
          </Slam>
          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["quick", "fix", "friday", "two", "days", "line", "login", "payments", "pager", "saturday", "sunday", "gone", "weekend", "monday"]} />
        </>
      }
    />
  );
};
