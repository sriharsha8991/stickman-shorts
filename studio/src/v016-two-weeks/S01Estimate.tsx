import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { POWER_PEAK, PowerUp, powerHits } from "../shared/powerup";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V016 · Estimated 2 days. Took 2 weeks. Retention v2 cut (~29.6 s), Number Reveal, power-up "impact"
// (the row's "meter" was swapped: H28, the previous produced video, opened with meter).
// World: a cork pinboard in a dev team room (cork + coral sticky notes + charcoal + mustard).
// Frame 0: Spark slams a rubber stamp "2 DAYS" onto TICKET #482 while a tear-off calendar sheds pages to DAY 14.
// Then the 1994 thesis study as three bars (GUESS 34 · WORST CASE 49 · ACTUAL 56), a 29.7% on-time pie, the
// twist (they knew they'd been late), REMEMBER ✗ vs LINK ✓, and the payoff: open your last similar ticket.
// Source: Buehler, Griffin & Ross (1994), JPSP 67(3):366–381, Studies 1 & 4.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const SX = 200;
const CORK = "#c8955a";
const CORK2 = "#a8743f";
const CORAL = "#ef5b4c";
const MUSTARD = "#f2b632";
const CHAR = "#2d2f36";
const NOTE = "#fff3a8";
const OKG = "#3aa35b";
const INK = COL.ink;
const PEAK = POWER_PEAK.impact; // 12

const T = {
  said: W(0, 1),
  days: W(0, 3),
  been: W(0, 5),
  weeks: W(0, 7),
  why: C(1),
  fail: W(1, 5),
  next: W(1, 7),
  students: C(2),
  guessed: W(2, 1),
  thesis: W(2, 3),
  n34: W(2, 6),
  it: C(3),
  n56: W(3, 2),
  even: C(4),
  worst: W(4, 2),
  fast: W(4, 6),
  fewer: C(5),
  one: W(5, 2),
  three: W(5, 4),
  time: W(5, 7),
  twist: W(6, 1),
  knew: W(6, 3),
  late: W(6, 6),
  just: C(7),
  remembering: W(7, 1),
  fix: W(7, 3),
  linking: C(8),
  job: W(8, 3),
  thisOne: W(8, 5),
  did: W(8, 7),
  before: C(9),
  estimate: W(9, 2),
  open: W(9, 3),
  ticket: W(9, 7),
  how: C(10),
  take: W(10, 5),
  now: C(11),
  long: W(11, 2),
};
const LOOP = VOICE_FRAMES - 16;
const STAMP_X = 650;
const STAMP_Y = 860;

// --- background: cork pinboard -------------------------------------------------------------------------------
const Cork: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="v16vig" cx="50%" cy="42%" r="78%">
          <stop offset="50%" stopColor={CORK} />
          <stop offset="100%" stopColor={CORK2} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#v16vig)" />
      {Array.from({ length: 220 }, (_, i) => (
        <circle key={i} cx={random(`cx${i}`) * 1080} cy={random(`cy${i}`) * 1920} r={2 + random(`cr${i}`) * 4} fill={random(`cc${i}`) > 0.5 ? "#8c5e30" : "#e0b47c"} opacity={0.45} />
      ))}
      {/* wooden frame */}
      <rect x={18} y={190} width={1044} height={1620} fill="none" stroke="#6b4423" strokeWidth={26} />
      <rect x={31} y={203} width={1018} height={1594} fill="none" stroke={INK} strokeWidth={4} opacity={0.6} />
      {/* faint decor notes at the edges */}
      {[
        [110, 300, -8, "#ffd1dc"],
        [980, 330, 7, "#c9f2ff"],
        [960, 1640, -5, NOTE],
        [120, 1660, 6, "#d6f5c9"],
      ].map(([x, y, r, c], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} opacity={0.55}>
          <rect x={-60} y={-60} width={120} height={120} fill={c as string} stroke={INK} strokeWidth={3} />
          <circle cy={-48} r={9} fill={CORAL} stroke={INK} strokeWidth={3} />
          <line x1={-40} y1={-10} x2={40} y2={-10} stroke={INK} strokeWidth={3} opacity={0.4} />
          <line x1={-40} y1={14} x2={25} y2={14} stroke={INK} strokeWidth={3} opacity={0.4} />
        </g>
      ))}
      {/* desk edge = ground */}
      <rect x={31} y={GROUND} width={1018} height={1797 - GROUND} fill="#5b3a1e" opacity={0.92} />
      <line x1={31} y1={GROUND} x2={1049} y2={GROUND} stroke={INK} strokeWidth={7} />
      {/* string between pins swaying slightly */}
      <path d={`M 60 640 Q 540 ${660 + 6 * Math.sin(f / 20)} 1020 640`} fill="none" stroke="#e8e0d0" strokeWidth={3} opacity={0.5} />
    </svg>
  </AbsoluteFill>
);

// --- props ------------------------------------------------------------------------------------------------------
const Pin: React.FC<{ x: number; y: number; c?: string }> = ({ x, y, c = CORAL }) => (
  <g>
    <circle cx={x} cy={y} r={13} fill={c} stroke={INK} strokeWidth={4} />
    <circle cx={x - 4} cy={y - 4} r={4} fill="#fff" opacity={0.7} />
  </g>
);

const Ticket: React.FC<{ x: number; y: number; s?: number; r?: number; id: string; line1: string; line2?: string; head?: string }> = ({ x, y, s = 1, r = 0, id, line1, line2, head = CHAR }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <rect x={-210} y={-140} width={420} height={280} rx={14} fill="#fffdf6" {...K} strokeWidth={7} />
    <rect x={-210} y={-140} width={420} height={70} rx={14} fill={head} {...K} strokeWidth={7} />
    <text y={-92} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill="#fff" letterSpacing={2}>
      {id}
    </text>
    <text x={-180} y={-12} fontFamily={FONT.title} fontWeight={800} fontSize={40} fill={INK}>
      {line1}
    </text>
    {line2 && (
      <text x={-180} y={44} fontFamily={FONT.title} fontWeight={800} fontSize={40} fill={INK}>
        {line2}
      </text>
    )}
    <Pin x={0} y={-150} />
  </g>
);

const Stamp: React.FC<{ x: number; y: number; s: number; text: string; color?: string; r?: number; size?: number }> = ({ x, y, s, text, color = CORAL, r = -10, size = 78 }) =>
  s > 0.01 ? (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <rect x={-text.length * size * 0.29 - 26} y={-size * 0.62} width={text.length * size * 0.58 + 52} height={size * 1.15} rx={10} fill="none" stroke={color} strokeWidth={9} />
      <text y={size * 0.33} textAnchor="middle" fontFamily={FONT.comic} fontSize={size} fill={color} letterSpacing={2}>
        {text}
      </text>
    </g>
  ) : null;

// tear-off desk calendar
const DeskCal: React.FC<{ f: number; x: number; y: number; day: number; s?: number; flip?: boolean }> = ({ f, x, y, day, s = 1, flip = false }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-110} y={-120} width={220} height={240} rx={14} fill="#fffdf6" {...K} strokeWidth={7} />
    <rect x={-110} y={-120} width={220} height={64} rx={14} fill={CORAL} {...K} strokeWidth={7} />
    <text y={-74} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill="#fff" letterSpacing={3}>
      DAY
    </text>
    <text y={80} textAnchor="middle" fontFamily={FONT.comic} fontSize={130} fill={day > 2 ? CORAL : INK}>
      {day}
    </text>
    {[-70, -25, 25, 70].map((rx) => (
      <circle key={rx} cx={rx} cy={-120} r={9} fill={CHAR} />
    ))}
    {/* flying page */}
    {(() => {
      const ph = (f % 4) / 4;
      return flip && day > 1 && day < 14 ? (
        <g transform={`translate(${ph * 220} ${-ph * 260}) rotate(${ph * 70})`} opacity={1 - ph}>
          <rect x={-100} y={-50} width={200} height={170} fill="#fffdf6" stroke={INK} strokeWidth={4} />
        </g>
      ) : null;
    })()}
  </g>
);

const Bar: React.FC<{ x: number; base: number; days: number; label: string; color: string; k: number; s?: number }> = ({ x, base, days, label, color, k }) => {
  const h = days * 10.5;
  return (
    <g opacity={k}>
      <rect x={x - 70} y={base - h} width={140} height={h} rx={8} fill={color} {...K} strokeWidth={6} />
      <text x={x} y={base - h - 22} textAnchor="middle" fontFamily={FONT.comic} fontSize={84} fill={INK} stroke="#fffdf6" strokeWidth={8} paintOrder="stroke">
        {Math.round(days)}
      </text>
      <text x={x} y={base + 50} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill="#fffdf6" letterSpacing={1}>
        {label}
      </text>
    </g>
  );
};

// --- sfx --------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "whoosh", 0.5],
  [PEAK, "stamp", 0.8],
  [PEAK, "impact", 0.6],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [T.been + i * 4, "page", 0.25]),
  [T.weeks, "buzz", 0.4],
  [T.why, "boing", 0.35],
  [T.next, "swish", 0.4],
  [T.students, "page", 0.45],
  [T.guessed, "scribble", 0.35],
  [T.n34, "ding", 0.45],
  [T.it - 10, "riser", 0.5],
  [T.n56, "slam", 0.7],
  [T.worst, "whoosh", 0.4],
  [T.fast, "stamp", 0.55],
  [T.one, "swirl", 0.35],
  [T.three, "pop", 0.45],
  [T.twist - 8, "riser", 0.4],
  [T.knew, "stinger", 0.55],
  [T.late, "stamp", 0.4],
  [T.remembering, "swirl", 0.35],
  [T.fix, "buzz", 0.45],
  [T.job, "chains", 0.4],
  [T.did, "gold", 0.55],
  [T.open, "swish", 0.4],
  [T.ticket, "pop", 0.4],
  [T.take, "ding", 0.45],
  [LOOP - 6, "whoosh", 0.45],
];

export const S01Estimate: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // --- windows ---
  const openK = Math.max(win(f, -10, T.students, 6), interpolate(f, [T.now - 6, T.now + 2], [0, 1], clamp));
  const barsK = win(f, T.students - 2, T.fewer, 6);
  const pieK = win(f, T.fewer - 2, T.twist - 6, 6);
  const knewK = win(f, T.twist - 6, T.just - 2, 6);
  const remK = win(f, T.just - 2, T.linking - 2, 6);
  const linkK = win(f, T.linking - 2, T.before - 2, 6);
  const payK = win(f, T.before - 2, T.now - 2, 6);

  // frame-0 stamp: Spark raises it, slams on PEAK; re-raised for the loop
  const stampS = f < T.now ? (f < PEAK ? interpolate(f, [0, PEAK], [2.6, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 1) : interpolate(f, [LOOP - 2, LOOP + 4], [2.6, 2.6], clamp);
  const calDay = f < T.now ? Math.round(interpolate(f, [T.been - 4, T.weeks + 4], [2, 14], clamp)) : 2;
  const nextK = interpolate(f, [T.next - 6, T.next + 2], [0, 1], clamp);

  // number bars
  const guess = interpolate(f, [T.guessed, T.n34 + 6], [0, 34], { ...clamp, easing: Easing.out(Easing.cubic) });
  const actual = interpolate(f, [T.it - 10, T.n56], [0, 56], { ...clamp, easing: Easing.in(Easing.quad) });
  const worstK = interpolate(f, [T.worst - 4, T.worst + 2], [0, 1], clamp);
  const worst = interpolate(f, [T.worst - 2, T.worst + 14], [0, 49], { ...clamp, easing: Easing.out(Easing.cubic) });

  // pie sweep to 29.7 %
  const pieP = interpolate(f, [T.one - 4, T.three + 4], [0, 0.297], { ...clamp, easing: Easing.out(Easing.cubic) });

  // link chain
  const chainP = interpolate(f, [T.job - 6, T.did], [0, 1], clamp);

  const overlayK = Math.max(interpolate(f, [T.why - 8, T.why], [1, 0], clamp), interpolate(f, [LOOP - 6, LOOP], [0, 1], clamp));

  const sparkKeys = gestureKeys([
    [0, { ...G.pointUp, ra1: 150, ra2: 40, lean: -6 }],
    [PEAK - 3, { ...G.pointUp, ra1: 160, ra2: 30, lean: -8 }],
    [PEAK, { ...G.pointSide, ra1: 80, ra2: 20, lean: 16 }, "snap"],
    [T.days, G.count2, "snap"],
    [T.been, G.pointSide, "snap"],
    [T.weeks, G.facepalm, "snap"],
    [T.why, G.shrugBig, "snap"],
    [T.next, G.doublePoint, "snap"],
    [T.students, G.present, "snap"],
    [T.n34, G.count1, "snap"],
    [T.n56, G.recoil, "snap"],
    [T.worst, G.thinkChin, "snap"],
    [T.fast, G.pointSide, "snap"],
    [T.fewer, G.presentBoth, "snap"],
    [T.three, G.pointDown, "snap"],
    [T.twist, G.leanIn, "snap"],
    [T.knew, G.mindBlown, "snap"],
    [T.just, G.armsCrossed, "snap"],
    [T.fix, G.stop, "snap"],
    [T.linking, G.beckon, "snap"],
    [T.did, G.celebrate, "snap"],
    [T.before, G.whisper, "snap"],
    [T.open, G.present, "snap"],
    [T.how, G.pointUp, "snap"],
    [T.take, G.thinkChin, "snap"],
    [T.now, { ...G.pointUp, ra1: 150, ra2: 40, lean: -6 }, "snap"],
  ]);
  const mood = (t: number): Mood =>
    t < PEAK ? "determined" : t < T.been ? "smug" : t < T.why ? "shock" : t < T.students ? "worried" : t < T.n56 ? "curious" : t < T.worst ? "shock" : t < T.fewer ? "skeptical" : t < T.twist ? "sad" : t < T.just ? "mindblown" : t < T.linking ? "skeptical" : t < T.before ? "excited" : t < T.how ? "wink" : t < T.now ? "thinking" : "determined";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.knew, 26), bulbPulse(t, T.did, 30));
  const z = punch(f, [PEAK, T.weeks, T.n56, T.knew, T.did], 0.035);

  const holdingStamp = f < T.students || f >= T.now - 4;

  return (
    <Stage
      bg={<Cork f={f} />}
      hits={[...powerHits("impact", 0), T.n56, T.knew]}
      power={11}
      cam={{ z }}
      svg={
        <>
          <PowerUp kind="impact" f={f} at={0} x={SX} y={GROUND} h={185 * SS} tx={STAMP_X} ty={STAMP_Y} layer="back" />

          {/* frame-0 tableau: ticket + stamp + desk calendar */}
          {openK > 0.01 && (
            <g opacity={openK}>
              <Ticket x={STAMP_X} y={820} r={-3} id={f < T.now ? "TICKET #482" : "TICKET #483"} line1="ESTIMATE:" />
              {f < T.now ? <g opacity={interpolate(f, [0, PEAK], [0.55, 1], clamp)}><Stamp x={STAMP_X + 40} y={STAMP_Y + 20} s={stampS} text="2 DAYS" /></g> : f >= LOOP + 4 ? <Stamp x={STAMP_X + 40} y={STAMP_Y + 20} s={1} text="2 DAYS" /> : null}
              <Burst x={STAMP_X + 40} y={STAMP_Y} at={PEAK} f={f} size={300} color={CORAL} />
              {(nextK < 0.5 || f >= T.now) && <DeskCal f={f} x={860} y={1170} day={calDay} s={0.85} flip={f > T.been - 4 && f < T.weeks + 4} />}
              {f >= T.weeks && f < T.now && (
                <g transform={`translate(510 1160) scale(${pop(f, T.weeks)}) rotate(-6)`}>
                  <Stamp x={0} y={0} s={1} text="2 WEEKS" color={CHAR} size={64} r={0} />
                </g>
              )}
              {/* next ticket slides in: same 2 DAYS, ghost "→ 2 WEEKS?" */}
              {nextK > 0.01 && f < T.now && (
                <g opacity={nextK} transform={`translate(${interpolate(nextK, [0, 1], [300, 0])} 0)`}>
                  <Ticket x={820} y={1150} s={0.62} r={5} id="NEXT TICKET" line1="ESTIMATE: 2 DAYS" head={CORAL} />
                </g>
              )}
            </g>
          )}

          {/* the study: three bars */}
          {barsK > 0.01 && (
            <g opacity={barsK}>
              <Bar x={490} base={1220} days={guess} label="GUESS" color={MUSTARD} k={interpolate(f, [T.guessed - 4, T.guessed], [0, 1], clamp)} />
              <Bar x={690} base={1220} days={worst} label="WORST CASE" color="#9aa3b5" k={worstK} />
              <Bar x={890} base={1220} days={actual} label="ACTUAL" color={CORAL} k={interpolate(f, [T.it - 12, T.it - 8], [0, 1], clamp)} />
              {f >= T.n56 && (
                <g opacity={interpolate(f, [T.n56, T.n56 + 6], [0, 1], clamp)}>
                  <line x1={400} x2={980} y1={1220 - 56 * 10.5} y2={1220 - 56 * 10.5} stroke={CORAL} strokeWidth={5} strokeDasharray="18 12" />
                  <Burst x={890} y={1220 - 56 * 10.5} at={T.n56} f={f} size={260} color={CORAL} />
                </g>
              )}
              {f >= T.fast && <Stamp x={690} y={980} s={interpolate(f - T.fast, [0, 5, 8], [2.2, 0.9, 1], clamp)} text="TOO FAST" color={CHAR} size={56} r={-12} />}
              {/* thesis paper stack icon */}
              <g transform={`translate(480 ${1220 - 34 * 10.5 - 170}) scale(${pop(f, T.thesis) * 0.8})`} opacity={interpolate(f, [T.thesis, T.thesis + 4, T.it - 4, T.it], [0, 1, 1, 0], clamp)}>
                {[0, 1, 2].map((i) => (
                  <rect key={i} x={-70 + i * 6} y={-90 + i * 6} width={140} height={180} fill="#fffdf6" stroke={INK} strokeWidth={4} />
                ))}
                <text x={12} y={-30} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={INK}>
                  THESIS
                </text>
                {[0, 1, 2, 3].map((i) => (
                  <line key={i} x1={-40} x2={70} y1={i * 22 + 4} y2={i * 22 + 4} stroke={INK} strokeWidth={3} opacity={0.4} />
                ))}
              </g>
            </g>
          )}

          {/* < 1 in 3 on time: pie */}
          {pieK > 0.01 && (
            <g opacity={pieK} transform={`translate(680 960) scale(${pop(f, T.fewer - 2)})`}>
              <circle r={250} fill={CHAR} {...K} strokeWidth={8} />
              {pieP > 0.001 && (
                <path
                  d={`M 0 0 L 0 -250 A 250 250 0 ${pieP > 0.5 ? 1 : 0} 1 ${250 * Math.sin(pieP * 2 * Math.PI)} ${-250 * Math.cos(pieP * 2 * Math.PI)} Z`}
                  fill={OKG}
                  {...K}
                  strokeWidth={8}
                />
              )}
              <text x={110} y={-80} textAnchor="middle" fontFamily={FONT.comic} fontSize={78} fill="#fff" stroke={INK} strokeWidth={6} paintOrder="stroke" opacity={interpolate(f, [T.three, T.three + 6], [0, 1], clamp)}>
                29.7%
              </text>
              <text x={110} y={-20} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill="#fff" opacity={interpolate(f, [T.three, T.three + 6], [0, 1], clamp)}>
                ON TIME
              </text>
              <text x={-70} y={120} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={CORAL} opacity={interpolate(f, [T.time, T.time + 6], [0, 1], clamp)}>
                LATE
              </text>
            </g>
          )}

          {/* the twist: they knew — past tickets stamped LATE, a confident STUDENT */}
          {knewK > 0.01 && (
            <g opacity={knewK}>
              {[0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${500 + i * 70} ${700 + i * 150}) rotate(${-8 + i * 6}) scale(${pop(f, T.twist + i * 4) * 0.58})`}>
                  <Ticket x={0} y={0} id={`PAST #${i + 1}`} line1="DUE: FRIDAY" />
                  {f >= T.late + i * 3 && <Stamp x={30} y={30} s={interpolate(f - T.late - i * 3, [0, 4, 7], [2, 0.9, 1], clamp)} text="LATE" size={86} />}
                </g>
              ))}
              <Actor
                f={f}
                color={COL.grey}
                scale={1.3}
                label="STUDENT"
                face="happy"
                base={{ x: 880, y: GROUND - 92.5 * 1.3 }}
                facing={-1}
                keys={[
                  { f: 0, p: { ra1: 150, ra2: 20, la1: -40, la2: 10 } },
                  { f: T.knew, p: { ra1: 160, ra2: 10, la1: -40, la2: 10, lean: -4 } },
                ]}
                mod={(t, q) => addPose(q, idle(t, 6))}
              />
              <g transform={`translate(860 ${GROUND - 470}) scale(${pop(f, T.knew)}) rotate(4)`}>
                <rect x={-150} y={-60} width={300} height={110} rx={12} fill={NOTE} {...K} strokeWidth={5} />
                <text y={-12} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill={INK}>
                  THIS TIME
                </text>
                <text y={34} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill={OKG}>
                  I'LL BE ON TIME!
                </text>
              </g>
            </g>
          )}

          {/* just remembering: thought cloud of past tickets, estimate unchanged */}
          {remK > 0.01 && (
            <g opacity={remK}>
              <g transform={`translate(680 760) scale(${pop(f, T.just - 2)})`}>
                {[
                  [-150, 0, 110],
                  [-40, -60, 130],
                  [90, -40, 120],
                  [170, 30, 100],
                  [0, 60, 140],
                  [-170, 70, 90],
                ].map(([x, y, r], i) => (
                  <circle key={i} cx={x} cy={y} r={r} fill="#fffdf6" stroke={INK} strokeWidth={6} />
                ))}
                {[
                  [-150, 0, 110],
                  [-40, -60, 130],
                  [90, -40, 120],
                  [170, 30, 100],
                  [0, 60, 140],
                  [-170, 70, 90],
                ].map(([x, y, r], i) => (
                  <circle key={`i${i}`} cx={x} cy={y} r={r - 6} fill="#fffdf6" />
                ))}
                <text y={-10} textAnchor="middle" fontFamily={FONT.comic} fontSize={54} fill={CHAR}>
                  "I WAS LATE LAST TIME"
                </text>
                <text y={60} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={INK} opacity={0.7}>
                  …ANYWAY:
                </text>
              </g>
              <Ticket x={680} y={1110} s={0.6} id="NEW TICKET" line1="ESTIMATE: 2 DAYS" />
              {f >= T.fix && (
                <g transform={`translate(680 1060) scale(${interpolate(f - T.fix, [0, 5, 8], [2.4, 0.9, 1], clamp)})`}>
                  <line x1={-120} y1={-120} x2={120} y2={120} stroke={CORAL} strokeWidth={26} strokeLinecap="round" />
                  <line x1={120} y1={-120} x2={-120} y2={120} stroke={CORAL} strokeWidth={26} strokeLinecap="round" />
                </g>
              )}
            </g>
          )}

          {/* linking the last job to this one */}
          {linkK > 0.01 && (
            <g opacity={linkK}>
              <Ticket x={560} y={780} s={0.8} r={-4} id="LAST JOB" line1="EST: 2 DAYS" line2="TOOK: 9 DAYS" head={CHAR} />
              <Ticket x={790} y={1110} s={0.8} r={4} id="THIS JOB" line1={f >= T.did ? "EST: 9 DAYS" : "EST: ?"} head={OKG} />
              {/* chain links from last to this */}
              {Array.from({ length: 7 }, (_, i) => {
                const p = (i + 1) / 8;
                if (chainP < p) return null;
                const x = 600 + (780 - 600) * p;
                const y = 860 + (1010 - 860) * p;
                return <ellipse key={i} cx={x} cy={y} rx={22} ry={13} fill="none" stroke={MUSTARD} strokeWidth={9} transform={`rotate(${i % 2 ? 40 : -50} ${x} ${y})`} />;
              })}
              {f >= T.did && <Burst x={800} y={1110} at={T.did} f={f} size={280} color={OKG} />}
              <text x={680} y={1270} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={30} fill="#fffdf6" opacity={interpolate(f, [T.did, T.did + 8], [0, 1], clamp)}>
                guesses matched reality — on average (Study 4)
              </text>
            </g>
          )}

          {/* payoff: open your last similar ticket */}
          {payK > 0.01 && (
            <g opacity={payK}>
              {/* folder */}
              <g transform={`translate(690 1000) scale(${pop(f, T.before - 2)})`}>
                <path d="M -260 -170 L -110 -170 L -80 -210 L 60 -210 L 90 -170 L 260 -170 L 260 190 L -260 190 Z" fill={MUSTARD} {...K} strokeWidth={7} />
                <text x={-230} y={-120} fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={INK}>
                  DONE TICKETS
                </text>
                {f >= T.open && (
                  <g transform={`translate(0 ${interpolate(f, [T.open, T.open + 10], [80, -20], { ...clamp, easing: Easing.out(Easing.back(1.4)) })})`}>
                    <Ticket x={0} y={40} s={0.95} id="LAST SIMILAR" line1="EST: 2 DAYS" line2="TOOK: 9 DAYS" head={CHAR} />
                  </g>
                )}
              </g>
              {f >= T.how - 4 && (
                <g transform={`translate(720 700) rotate(${-5 + Math.sin(f / 10) * 1.5}) scale(${pop(f, T.how - 4)})`}>
                  <rect x={-230} y={-90} width={460} height={180} fill={NOTE} {...K} strokeWidth={6} />
                  <rect x={-60} y={-108} width={120} height={34} fill="#e8e0d0" opacity={0.85} />
                  <text y={-10} textAnchor="middle" fontFamily={FONT.comic} fontSize={58} fill={INK}>
                    HOW LONG DID
                  </text>
                  <text y={54} textAnchor="middle" fontFamily={FONT.comic} fontSize={58} fill={CORAL}>
                    THAT TAKE?
                  </text>
                </g>
              )}
            </g>
          )}

          {/* SPARK (left, facing right) */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: SX, y: SGY }}
            facing={1}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={mood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 2));
              q = addPose(addPose(q, hop(t, T.n56, 30)), hop(t, T.did, 36));
              q = addPose(addPose(q, shake(t, T.fix)), nod(t, T.take));
              return q;
            }}
          >
            {(j) =>
              holdingStamp && (f < PEAK + 6 || f >= T.now - 4) ? (
                <g transform={`translate(${j.rHand[0]} ${j.rHand[1]}) rotate(${f < PEAK ? -20 : 0})`}>
                  <rect x={-16} y={-70} width={32} height={60} rx={10} fill="#6b4423" stroke={INK} strokeWidth={5} />
                  <rect x={-40} y={-14} width={80} height={30} rx={6} fill={CORAL} stroke={INK} strokeWidth={5} />
                </g>
              ) : null
            }
          </Spark>
          <PowerUp kind="impact" f={f} at={0} x={SX} y={GROUND} h={185 * SS} tx={STAMP_X} ty={STAMP_Y} layer="front" />
        </>
      }
      html={
        <>
          <div style={{ position: "absolute", right: 80, top: 236, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: "#fffdf6", letterSpacing: 2, opacity: 0.9 }}>HIDDEN MECHANISM #16</div>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 440, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 120, color: "#fffdf6", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", lineHeight: 1 }}>ESTIMATE: 2 DAYS.</div>
              <div style={{ display: "inline-block", marginTop: 10, background: CORAL, color: "#fff", padding: "4px 30px", fontFamily: FONT.comic, fontSize: 104, border: `6px solid ${INK}` }}>ACTUAL: ?</div>
            </div>
          )}
          <Slam f={f} at={T.why} out={T.students - 4} x={540} y={420} size={100} color={CORAL} stroke={`9px #fffdf6`} rotate={-2}>
            WHY? EVERY. TIME.
          </Slam>
          <Slam f={f} at={T.students} out={T.even - 4} x={540} y={420} size={92} color="#fffdf6" stroke={`9px ${INK}`} rotate={2}>
            STUDENTS · THESIS DAYS
          </Slam>
          <Slam f={f} at={T.even} out={T.fewer - 4} x={540} y={420} size={96} color={MUSTARD} stroke={`9px ${INK}`} rotate={-2}>
            EVEN THE WORST CASE
          </Slam>
          <Slam f={f} at={T.fewer} out={T.twist - 8} x={540} y={420} size={104} color="#fffdf6" stroke={`9px ${INK}`} rotate={2}>
            FEWER THAN 1 IN 3
          </Slam>
          <Slam f={f} at={T.twist} out={T.just - 4} x={540} y={420} size={120} color={CORAL} stroke={`10px #fffdf6`} rotate={-3}>
            THEY KNEW.
          </Slam>
          <Slam f={f} at={T.just} out={T.linking - 4} x={540} y={420} size={110} color="#fffdf6" stroke={`9px ${INK}`} rotate={2}>
            REMEMBER ✗
          </Slam>
          <Slam f={f} at={T.linking} out={T.before - 4} x={540} y={420} size={120} color={OKG} stroke={`10px #fffdf6`} rotate={-2}>
            LINK IT ✓
          </Slam>
          <Slam f={f} at={T.before} out={T.now - 4} x={540} y={420} size={96} color={MUSTARD} stroke={`9px ${INK}`} rotate={2}>
            OPEN THE LAST ONE
          </Slam>
          {f >= T.students - 4 && f < T.now - 4 && (
            <div style={{ position: "absolute", left: 540, top: 1735, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: "#fffdf6", whiteSpace: "nowrap" }}>
              Buehler, Griffin & Ross 1994 (JPSP) · small student studies · tickets illustrative
            </div>
          )}
          <VoiceCaptions
            f={f}
            y={1480}
            cues={VOICE_CUES}
            hi={["two", "days.", "weeks.", "fail", "thirty-four", "fifty-six.", "worst-case", "one", "three", "knew", "remembering", "linking", "did.", "last", "similar", "take?"]}
          />
        </>
      }
    />
  );
};
