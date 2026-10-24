import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { POWER_PEAK, PowerGauge, PowerUp, powerHits } from "../shared/powerup";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H28 · 5 minutes of cyclic sighing. Retention v2 cut (~28.5 s), Number Reveal, power-up "meter" (V015 before it
// used dash). Calm sunrise: peach-to-mint sky, soft sun, rolling hills, drifting clouds. Spark RIGHT.
// Frame 0: a CALM gauge fills and overloads under "5 MINUTES. JUST BREATHE OUT." Two balloons (double inhale)
// and one long deflate carry the technique. 28-day calendar + 108 dots, bars +1.22 (mindfulness) vs +1.89
// (cyclic sighing), how-to 1-2-3, caveat card, 5:00 timer, loop back into the balloons/gauge.
// Source: Balban et al. 2023, Cell Reports Medicine 4:100895 (PMC9873947). Education, not medical advice.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const SX = 880;
const PEACH = "#ffd8c2";
const MINT = "#c9f0e1";
const CORAL = "#ff7a6b";
const SEA = "#2bb39a";
const DEEP = "#1f4e5f";
const SUN = "#ffc94d";
const INK = COL.ink;
const PEAK = POWER_PEAK.meter; // 34
const GX = 470; // gauge centre
const GY = 700;

const T = {
  stop: C(0),
  five: W(0, 3),
  beat: W(0, 6),
  study: W(1, 2),
  double: W(1, 4),
  sigh: W(1, 5),
  why: W(1, 7),
  how: W(2, 3),
  out: W(2, 6),
  month: W(3, 1),
  hundred: W(3, 3),
  people: W(3, 6),
  fivemin: W(3, 7),
  day: W(3, 10),
  mind: C(4),
  little: W(4, 5),
  cyclic: C(5),
  more: W(5, 4),
  bin: C(6),
  sip: W(6, 2),
  air: W(6, 6),
  then: C(7),
  long: W(7, 2),
  bout: W(7, 5),
  small: C(8),
  prereg: W(8, 3),
  treat: W(8, 7),
  free: W(9, 2),
  try: W(9, 3),
  today: W(9, 6),
  loopIn: C(10),
  loopSip: W(10, 2),
};
const LOOP = VOICE_FRAMES - 16;

// --- background: calm sunrise --------------------------------------------------------------------------
const Sunrise: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="h28sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PEACH} />
          <stop offset="70%" stopColor={MINT} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#h28sky)" />
      <circle cx={180} cy={360 + Math.sin(f / 60) * 6} r={110} fill={SUN} opacity={0.85} />
      <circle cx={180} cy={360 + Math.sin(f / 60) * 6} r={150} fill={SUN} opacity={0.18} />
      {Array.from({ length: 4 }, (_, i) => {
        const x = ((random(`cx${i}`) * 1300 + f * (0.5 + i * 0.15)) % 1400) - 200;
        const y = 300 + i * 150 + random(`cy${i}`) * 60;
        return (
          <g key={i} opacity={0.8}>
            <ellipse cx={x} cy={y} rx={110} ry={34} fill="#fff" />
            <ellipse cx={x + 50} cy={y - 22} rx={60} ry={34} fill="#fff" />
          </g>
        );
      })}
      <path d={`M 0 ${GROUND - 60} Q 270 ${GROUND - 160} 560 ${GROUND - 70} T 1080 ${GROUND - 90} L 1080 1920 L 0 1920 Z`} fill="#9fdcc3" />
      <path d={`M 0 ${GROUND} Q 400 ${GROUND - 50} 760 ${GROUND - 10} T 1080 ${GROUND} L 1080 1920 L 0 1920 Z`} fill="#6cc7a6" />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={DEEP} strokeWidth={5} opacity={0.6} />
      {Array.from({ length: 14 }, (_, i) => (
        <path key={`g${i}`} d={`M ${40 + i * 75} ${GROUND + 40 + (i % 3) * 30} l 8 -22 l 8 22`} fill="none" stroke={DEEP} strokeWidth={3} opacity={0.35} />
      ))}
    </svg>
  </AbsoluteFill>
);

const Balloon: React.FC<{ x: number; y: number; k: number; color: string; label?: string }> = ({ x, y, k, color, label }) =>
  k > 0.02 ? (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M 0 0 Q 18 60 -6 120 T 4 220`} fill="none" stroke={INK} strokeWidth={3} />
      <g transform={`scale(${k})`}>
        <ellipse cx={0} cy={-110} rx={90} ry={110} fill={color} {...K} strokeWidth={6} />
        <ellipse cx={-30} cy={-150} rx={18} ry={30} fill="#fff" opacity={0.5} />
        <path d="M -12 0 L 12 0 L 0 -14 Z" fill={color} {...K} strokeWidth={4} />
      </g>
      {label && (
        <text y={260} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={DEEP}>
          {label}
        </text>
      )}
    </g>
  ) : null;

// --- sfx ----------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "riser", 0.4],
  [PEAK, "impact", 0.75],
  [PEAK + 2, "shatter", 0.35],
  [T.study, "page", 0.4],
  [T.double, "swish", 0.35],
  [T.sigh, "swish", 0.3],
  [T.why, "boing", 0.3],
  [T.out, "whoosh_long", 0.4],
  [T.month, "tick", 0.3],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [T.hundred + i * 4, "pop", 0.2]),
  [T.fivemin, "ding", 0.35],
  [T.mind, "swish", 0.35],
  [T.little, "thud", 0.35],
  [T.cyclic - 12, "riser", 0.45],
  [T.more, "stinger", 0.55],
  [T.bin, "swish", 0.3],
  [T.sip, "pop", 0.35],
  [T.long, "whoosh_long", 0.4],
  [T.small, "stamp", 0.5],
  [T.prereg, "stamp", 0.45],
  [T.treat, "stamp", 0.45],
  [T.try, "ding", 0.45],
  [T.today, "gold", 0.45],
  [T.loopIn, "swish", 0.3],
  [LOOP - 4, "riser", 0.3],
];

export const S01Sigh: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // CALM gauge: the preset's cold-open gauge until PEAK+24, then (after a crack) it rests; back at the loop
  const loopGaugeK = interpolate(f, [LOOP - 10, LOOP], [0, 1], clamp);
  const loopGaugeV = interpolate(f, [LOOP - 10, VOICE_FRAMES], [0, 0.12], clamp);

  // balloons: double inhale / long exhale
  const b1 =
    f < T.bin - 6
      ? interpolate(f, [T.double - 4, T.double + 8, T.out - 6, T.out + 40], [0, 0.85, 0.85, 0.15], clamp)
      : f < T.loopIn - 4
        ? interpolate(f, [T.bin, T.bin + 14, T.long, T.bout + 30], [0.15, 0.85, 0.85, 0.12], clamp)
        : interpolate(f, [T.loopIn, T.loopIn + 12], [0.12, 0.85], clamp);
  const b2 =
    f < T.bin - 6
      ? interpolate(f, [T.sigh - 2, T.sigh + 8, T.out - 6, T.out + 40], [0, 0.6, 0.6, 0.1], clamp)
      : f < T.loopIn - 4
        ? interpolate(f, [T.sip, T.sip + 10, T.long, T.bout + 30], [0.1, 0.62, 0.62, 0.08], clamp)
        : interpolate(f, [T.loopSip, T.loopSip + 10], [0.08, 0.6], clamp);
  const balK = Math.max(win(f, T.double - 6, T.month, 6), win(f, T.bin - 4, T.small, 6), interpolate(f, [T.loopIn - 6, T.loopIn], [0, 1], clamp) * interpolate(f, [LOOP, VOICE_FRAMES - 2], [1, 0], clamp));
  // breath-out stream
  const outStream = Math.max(win(f, T.out - 2, T.month - 4, 6), win(f, T.long - 2, T.small - 4, 6));

  // study: calendar + 108 dots
  const studyK = win(f, T.month - 2, T.mind, 6);
  const days = Math.round(interpolate(f, [T.month, T.hundred], [0, 28], clamp));
  const dots = Math.round(interpolate(f, [T.hundred, T.people + 8], [0, 108], { ...clamp, easing: Easing.out(Easing.cubic) }));
  // bars
  const barsK = win(f, T.mind - 2, T.bin, 6);
  const mH = interpolate(f, [T.mind + 6, T.little + 6], [0, 1.22], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sH = interpolate(f, [T.cyclic + 4, T.more + 4], [0, 1.89], { ...clamp, easing: Easing.out(Easing.back(1.5)) });
  // caveat
  const cavK = win(f, T.small - 2, T.free - 2, 6);
  // timer
  const timerK = win(f, T.free - 2, T.loopIn, 6);
  const secs = Math.round(interpolate(f, [T.try, T.loopIn], [300, 296], clamp));

  const overlayK = Math.max(interpolate(f, [T.study - 8, T.study], [1, 0], clamp), interpolate(f, [LOOP - 6, LOOP], [0, 1], clamp));

  const sparkKeys = gestureKeys([
    [0, { ...G.presentBoth, ra1: 40, la1: -40 }],
    [PEAK - 6, { ...G.presentBoth, ra1: 120, la1: -120 }],
    [PEAK, G.celebrate, "snap"],
    [T.beat, G.pointSide, "snap"],
    [T.study, G.count1, "snap"],
    [T.double, G.count2, "snap"],
    [T.why, G.thinkChin, "snap"],
    [T.how, G.leanIn, "snap"],
    [T.out, G.present, "smooth"],
    [T.month, G.pointUp, "snap"],
    [T.hundred, G.presentBoth, "snap"],
    [T.fivemin, G.doublePoint, "snap"],
    [T.mind, G.pointSide, "snap"],
    [T.little, G.shrugBig, "snap"],
    [T.cyclic, G.leanIn, "snap"],
    [T.more, G.mindBlown, "snap"],
    [T.bin, { ...G.presentBoth, ra1: 110, la1: -110, head: -8 }, "smooth"],
    [T.sip, { ...G.presentBoth, ra1: 140, la1: -140, head: -12 }, "snap"],
    [T.then, { ...G.presentBoth, ra1: 140, la1: -140, head: -12 }],
    [T.bout + 24, { ...G.rest, head: 6 }, "smooth"],
    [T.small, G.stop, "snap"],
    [T.prereg, G.armsCrossed, "snap"],
    [T.treat, G.handsHips, "snap"],
    [T.free, G.present, "snap"],
    [T.try, G.fistPump, "snap"],
    [T.loopIn, { ...G.presentBoth, ra1: 110, la1: -110 }, "smooth"],
    [LOOP, { ...G.presentBoth, ra1: 40, la1: -40 }, "snap"],
  ]);
  const mood = (t: number): Mood =>
    t < PEAK ? "determined" : t < T.study ? "smug" : t < T.why ? "excited" : t < T.month ? "curious" : t < T.mind ? "thinking" : t < T.cyclic ? "skeptical" : t < T.bin ? "mindblown" : t < T.small ? "happy" : t < T.free ? "worried" : t < T.loopIn ? "wink" : "determined";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.more, 34), bulbPulse(t, T.today, 24) * 0.8);
  const z = punch(f, [T.double, T.more, T.small, T.today], 0.035);

  return (
    <Stage
      bg={<Sunrise f={f} />}
      hits={[...powerHits("meter", 0), T.more]}
      power={10}
      cam={{ z }}
      svg={
        <>
          <PowerUp kind="meter" f={f} at={0} x={SX} y={GROUND} h={185 * SS} tx={GX} ty={GY} layer="back" color={SEA} gauge={{ label: "CALM", value: interpolate(f, [0, PEAK - 6, PEAK], [0, 1, 1.15], clamp) }} />
          {f >= PEAK + 22 && f < T.double + 4 && (
            <g opacity={interpolate(f, [PEAK + 22, PEAK + 24, T.double - 4, T.double + 4], [0, 1, 1, 0], clamp)}>
              <PowerGauge f={f} x={GX} y={GY} value={1} label="CALM: FULL" />
            </g>
          )}
          {loopGaugeK > 0.01 && (
            <g opacity={loopGaugeK}>
              <PowerGauge f={f} x={GX} y={GY} value={loopGaugeV} label="CALM" />
            </g>
          )}

          {/* balloons */}
          {balK > 0.01 && (
            <g opacity={balK}>
              <Balloon x={330} y={1060} k={b1 * 1.2} color={CORAL} label={f >= T.bin - 6 && f < T.loopIn - 4 ? "1 · BREATHE IN" : undefined} />
              <Balloon x={600} y={1060} k={b2 * 1.2} color={SEA} label={f >= T.sip && f < T.loopIn - 4 ? "2 · SIP MORE" : undefined} />
              {outStream > 0.01 && (
                <g opacity={outStream}>
                  {Array.from({ length: 6 }, (_, i) => {
                    const p = ((f * 0.02 + i / 6) % 1);
                    return <path key={i} d={`M ${300 + p * 420} ${760 - i * 6} q 30 -20 60 0 t 60 0`} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={1 - p} />;
                  })}
                  {f >= T.long - 4 && (
                    <text x={465} y={680} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={DEEP}>
                      3 · LONG, SLOW OUT
                    </text>
                  )}
                </g>
              )}
            </g>
          )}

          {/* study: 28-day calendar + 108 people */}
          {studyK > 0.01 && (
            <g opacity={studyK}>
              <g transform={`translate(420 860) scale(${pop(f, T.month - 2)})`}>
                <rect x={-250} y={-200} width={500} height={380} rx={20} fill="#fff" {...K} strokeWidth={7} />
                <rect x={-250} y={-200} width={500} height={70} rx={20} fill={CORAL} {...K} strokeWidth={7} />
                <text y={-150} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill="#fff">
                  28 DAYS
                </text>
                {Array.from({ length: 28 }, (_, i) => (
                  <g key={i} transform={`translate(${-210 + (i % 7) * 70} ${-90 + Math.floor(i / 7) * 66})`}>
                    <rect x={-26} y={-24} width={52} height={48} rx={8} fill={i < days ? MINT : "#f3f3f3"} stroke={INK} strokeWidth={3} />
                    {i < days && <path d="M -12 0 L -3 10 L 14 -10" fill="none" stroke={SEA} strokeWidth={6} strokeLinecap="round" />}
                  </g>
                ))}
              </g>
              {f >= T.hundred - 2 && (
                <g>
                  {Array.from({ length: dots }, (_, i) => (
                    <circle key={i} cx={190 + (i % 18) * 27} cy={1110 + Math.floor(i / 18) * 26} r={10} fill={i < 30 ? SEA : "#8fb9c9"} stroke={INK} strokeWidth={2} />
                  ))}
                </g>
              )}
            </g>
          )}

          {/* bars: daily change in positive mood */}
          {barsK > 0.01 && (
            <g opacity={barsK}>
              <line x1={110} y1={1200} x2={780} y2={1200} stroke={DEEP} strokeWidth={6} />
              {[
                { x: 270, v: mH, c: "#a9b7c6", l: "MINDFULNESS", n: "+1.22" },
                { x: 600, v: sH, c: SEA, l: "CYCLIC SIGHING", n: "+1.89" },
              ].map((b, i) =>
                i === 0 || f >= T.cyclic ? (
                  <g key={i}>
                    <rect x={b.x - 110} y={1200 - 230 * b.v} width={220} height={230 * b.v} fill={b.c} {...K} strokeWidth={6} />
                    <text x={b.x} y={1250} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={DEEP}>
                      {b.l}
                    </text>
                    {b.v > 0.3 && (
                      <text x={b.x} y={1200 - 230 * b.v - 24} textAnchor="middle" fontFamily={FONT.comic} fontSize={66} fill={i ? SEA : "#6d7d8c"} stroke={INK} strokeWidth={3} paintOrder="stroke">
                        {b.n}
                      </text>
                    )}
                  </g>
                ) : null,
              )}
              {f >= T.more && f < T.more + 16 && <Burst x={600} y={1200 - 230 * 1.89} at={T.more} f={f} size={300} color={SUN} />}
            </g>
          )}

          {/* caveat card */}
          {cavK > 0.01 && (
            <g opacity={cavK} transform={`translate(440 930) scale(${pop(f, T.small - 2)}) rotate(-2)`}>
              <rect x={-320} y={-230} width={640} height={460} rx={26} fill="#fff" {...K} strokeWidth={8} />
              <text y={-140} textAnchor="middle" fontFamily={FONT.comic} fontSize={90} fill={CORAL}>
                THE CATCH
              </text>
              {[
                { t: "SMALL TRIAL", at: T.small },
                { t: "NOT PREREGISTERED", at: T.prereg },
                { t: "NOT A TREATMENT", at: T.treat },
              ].map((r, i) =>
                f >= r.at ? (
                  <g key={i} transform={`translate(0 ${-40 + i * 90}) scale(${pop(f, r.at)})`}>
                    <text textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={56} fill={INK}>
                      {r.t}
                    </text>
                  </g>
                ) : null,
              )}
            </g>
          )}

          {/* 5:00 timer */}
          {timerK > 0.01 && (
            <g opacity={timerK} transform={`translate(440 960) scale(${pop(f, T.free - 2)})`}>
              <circle r={220} fill="#fff" {...K} strokeWidth={9} />
              <circle r={190} fill="none" stroke={SEA} strokeWidth={22} strokeDasharray={`${2 * Math.PI * 190}`} strokeDashoffset={2 * Math.PI * 190 * (1 - secs / 300)} transform="rotate(-90)" strokeLinecap="round" />
              <text y={40} textAnchor="middle" fontFamily={FONT.comic} fontSize={150} fill={DEEP}>
                {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
              </text>
              <text y={120} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill={CORAL}>
                FREE · NO APP
              </text>
            </g>
          )}

          {/* SPARK (right, facing left) */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: SX, y: SGY }}
            facing={-1}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={mood}
            look={-1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 7));
              q = addPose(addPose(q, hop(t, T.more, 38)), hop(t, T.today, 34));
              q = addPose(addPose(q, shake(t, T.treat)), nod(t, T.try));
              return q;
            }}
          />
          <PowerUp kind="meter" f={f} at={0} x={SX} y={GROUND} h={185 * SS} tx={GX} ty={GY} layer="front" color={SEA} />
        </>
      }
      html={
        <>
          <div style={{ position: "absolute", right: 70, top: 250, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: DEEP, letterSpacing: 2, opacity: 0.85 }}>HIDDEN MECHANISM · HACK H28</div>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 440, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 140, color: "#fff", WebkitTextStroke: `12px ${DEEP}`, paintOrder: "stroke fill", lineHeight: 1 }}>5 MINUTES.</div>
              <div style={{ display: "inline-block", marginTop: 8, background: CORAL, color: "#fff", padding: "4px 30px", fontFamily: FONT.comic, fontSize: 92, border: `6px solid ${DEEP}` }}>JUST BREATHE OUT.</div>
            </div>
          )}
          <Slam f={f} at={T.study} out={T.how - 4} x={540} y={450} size={100} color={SEA} stroke={`9px #fff`} rotate={-2}>
            A DOUBLE SIGH. WHY?
          </Slam>
          <Slam f={f} at={T.how} out={T.month - 4} x={540} y={450} size={110} color={CORAL} stroke={`9px #fff`} rotate={2}>
            THE BREATH OUT
          </Slam>
          {studyK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 450, transform: `translate(-50%,-50%) scale(${pop(f, T.hundred - 2)})`, opacity: studyK * (f >= T.hundred - 2 ? 1 : 0), textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 140, color: "#fff", WebkitTextStroke: `12px ${DEEP}`, paintOrder: "stroke fill", lineHeight: 1 }}>{dots} PEOPLE</div>
              {f >= T.fivemin - 2 && <div style={{ display: "inline-block", fontFamily: FONT.title, fontWeight: 900, fontSize: 46, color: "#fff", background: DEEP, padding: "2px 18px" }}>5 MIN A DAY · 4 METHODS</div>}
            </div>
          )}
          {barsK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 440, transform: `translate(-50%,-50%) scale(${pop(f, T.mind - 2)})`, opacity: barsK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 104, color: f >= T.more ? SEA : "#fff", WebkitTextStroke: `10px ${DEEP}`, paintOrder: "stroke fill", lineHeight: 1 }}>{f >= T.more ? "SIGHING WINS" : "GOOD MOOD"}</div>
              <div style={{ display: "inline-block", fontFamily: FONT.title, fontWeight: 900, fontSize: 40, color: DEEP, background: "#fff", padding: "2px 18px" }}>DAILY CHANGE · 28 DAYS</div>
            </div>
          )}
          <Slam f={f} at={T.bin} out={T.small - 4} x={540} y={450} size={104} color={"#fff"} stroke={`10px ${SEA}`} rotate={-2}>
            IN · SIP · LONG OUT
          </Slam>
          <Slam f={f} at={T.try} out={T.loopIn - 4} x={540} y={450} size={110} color={SEA} stroke={`9px #fff`} rotate={2}>
            TRY 5 MIN TODAY
          </Slam>
          {f >= T.more && f < T.bin && <Stamp f={f} at={T.more + 6} x={800} y={760} text="1 STUDY" color={CORAL} size={70} r={10} />}
          <div style={{ position: "absolute", left: 540, top: 1700, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: DEEP, whiteSpace: "nowrap", background: "rgba(255,255,255,0.75)", padding: "4px 14px", lineHeight: 1.4 }}>
            Balban et al. 2023, Cell Reports Medicine (n = 108, 28 days)
            <br />
            <span style={{ color: CORAL, fontWeight: 900 }}>Education, not medical advice</span>
          </div>
          <VoiceCaptions
            f={f}
            y={1480}
            cues={VOICE_CUES}
            hi={["stop.", "five", "meditation.", "double", "sigh", "why?", "out.", "month.", "hundred", "eight", "little.", "more.", "sip", "long,", "small", "preregistered,", "treatment.", "free.", "today."]}
          />
        </>
      }
    />
  );
};
