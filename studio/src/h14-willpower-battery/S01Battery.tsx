import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { POWER_PEAK, PowerUp, powerHits } from "../shared/powerup";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H14 · Willpower isn't a battery. Retention v2 cut (~28 s), Myth vs Reality, power-up "beam" (V014 before it
// used impact). Night "power station": violet gradient, neon grid floor, circuit traces. Frame 0: a giant
// WILLPOWER battery blinking at 3% under "WILLPOWER: 3% LEFT"; Spark (right) fires a beam into it. 23 lab flasks,
// ROUND 1 (cross out the e's) → ROUND 2 (reaction test), predicted crash bar, 2,141 counter, RE-HOOK: the real
// round-2 bar matches round 1, d = 0.04, the battery peels off like a sticker (nothing behind it). 2021: 36 labs,
// 3,531 people, d = 0.06 → SAME. Caveat: one setup, scientists still argue. Payoff: stop rationing, shrink step 1.
// "Battery, a hundred percent…" drains back to 3% → frame 0.
// Sources: Hagger et al. 2016, Perspect Psychol Sci 11:546; Vohs et al. 2021, Psychol Sci 32:1566.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const SX = 905;
const V1 = "#160a33";
const V2 = "#3b1a78";
const LIME = "#b6ff3b";
const PINK = "#ff4fa3";
const CYAN = "#52e8ff";
const RED = "#ff3b4f";
const INK = COL.ink;
const PEAK = POWER_PEAK.beam; // 14
const BX = 420; // battery centre
const BY = 930;

const T = {
  plan: W(0, 1),
  day: W(0, 3),
  battery: W(0, 7),
  labs23: C(1),
  found: W(1, 2),
  drain1: W(1, 5),
  why: W(1, 6),
  test: W(2, 1),
  hard: W(2, 3),
  then: W(2, 5),
  another: W(2, 6),
  drains: W(3, 2),
  round: W(3, 3),
  crash: W(3, 6),
  people: C(4),
  later: W(4, 5),
  drain: W(5, 1),
  zero: W(5, 4),
  bigger: W(6, 1),
  y2021: W(6, 4),
  same: W(6, 6),
  setup: W(7, 2),
  scientists: W(7, 4),
  argue: W(7, 6),
  stop: W(8, 1),
  rationing: W(8, 2),
  make: W(8, 4),
  easy: W(8, 7),
  start: W(8, 9),
  batt: C(9),
  hundred: W(9, 2),
};
const LOOP = VOICE_FRAMES - 16;

// --- background: night power station ------------------------------------------------------------------
const Station: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="h14sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={V1} />
          <stop offset="100%" stopColor={V2} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#h14sky)" />
      {/* circuit traces */}
      {Array.from({ length: 9 }, (_, i) => {
        const y = 300 + i * 105;
        const x = 40 + random(`tr${i}`) * 200;
        const len = 160 + random(`tl${i}`) * 300;
        const side = i % 2 ? 1080 - x - len : x;
        const pulse = ((f * 6 + i * 90) % (len + 200)) - 100;
        return (
          <g key={i} opacity={0.35}>
            <path d={`M ${side} ${y} h ${len * 0.6} l 30 30 h ${len * 0.4}`} fill="none" stroke={CYAN} strokeWidth={4} />
            <circle cx={side + len * 0.6 + 30 + len * 0.4} cy={y + 30} r={8} fill={CYAN} />
            {pulse > 0 && pulse < len * 0.6 && <circle cx={side + pulse} cy={y} r={7} fill="#fff" />}
          </g>
        );
      })}
      {/* neon grid floor */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#0d0620" />
      {Array.from({ length: 8 }, (_, i) => {
        const y = GROUND + Math.pow(i / 7, 1.8) * (1920 - GROUND);
        return <line key={`h${i}`} x1={0} y1={y} x2={1080} y2={y} stroke={PINK} strokeWidth={3} opacity={0.5} />;
      })}
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`v${i}`} x1={540 + (i - 6) * 60} y1={GROUND} x2={540 + (i - 6) * 260} y2={1920} stroke={PINK} strokeWidth={3} opacity={0.4} />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={LIME} strokeWidth={6} />
    </svg>
  </AbsoluteFill>
);

// --- the willpower battery ----------------------------------------------------------------------------
const Battery: React.FC<{ f: number; level: number; peel: number; crack: number }> = ({ f, level, peel, crack }) => {
  const low = level < 0.15;
  const col = low ? RED : level < 0.5 ? "#ffb02e" : LIME;
  const blink = low && Math.floor(f / 8) % 2 === 0 ? 0.35 : 1;
  const w = 300;
  const h = 520;
  return (
    <g transform={`translate(${BX} ${BY})`}>
      {/* what's behind the sticker: nothing */}
      {peel > 0.02 && (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill="none" stroke="#ffffff" strokeWidth={5} strokeDasharray="16 14" opacity={0.6} />
          <text y={10} textAnchor="middle" fontFamily={FONT.comic} fontSize={60} fill="#ffffff" opacity={0.75 * peel}>
            NO TANK
          </text>
        </g>
      )}
      <g transform={`translate(${peel * -40} ${peel * peel * 900}) rotate(${peel * -38} ${-w / 2} ${-h / 2})`} opacity={1 - Math.max(0, peel - 0.75) * 4}>
        <rect x={-55} y={-h / 2 - 44} width={110} height={52} rx={12} fill="#d9d9e6" {...K} strokeWidth={7} />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill="#1d1640" {...K} strokeWidth={9} />
        <rect x={-w / 2 + 22} y={h / 2 - 22 - (h - 44) * level} width={w - 44} height={(h - 44) * level} rx={16} fill={col} opacity={blink} />
        {[1, 2, 3].map((i) => (
          <line key={i} x1={-w / 2 + 22} y1={-h / 2 + (h * i) / 4} x2={w / 2 - 22} y2={-h / 2 + (h * i) / 4} stroke={INK} strokeWidth={5} opacity={0.4} />
        ))}
        <text y={-150} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill="#fff" letterSpacing={2}>
          WILLPOWER
        </text>
        <text y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={110} fill="#fff" stroke={INK} strokeWidth={5} paintOrder="stroke">
          {Math.round(level * 100)}%
        </text>
        {crack > 0.01 && (
          <path d="M -40 -260 L -10 -150 L -70 -60 L 10 20 L -30 120 L 30 260" fill="none" stroke="#fff" strokeWidth={8} strokeDasharray="900" strokeDashoffset={900 * (1 - crack)} strokeLinejoin="round" />
        )}
        {/* sticker edge curl */}
        {peel > 0.01 && <path d={`M ${w / 2 - 70} ${h / 2} Q ${w / 2} ${h / 2} ${w / 2} ${h / 2 - 70} L ${w / 2 - 70} ${h / 2 - 70} Z`} fill="#c9c3e8" stroke={INK} strokeWidth={5} />}
      </g>
    </g>
  );
};

const Flask: React.FC<{ x: number; y: number; k: number; c: string }> = ({ x, y, k, c }) =>
  k > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d="M -12 -38 L 12 -38 L 12 -12 L 30 28 Q 32 38 22 38 L -22 38 Q -32 38 -30 28 L -12 -12 Z" fill="#fff" {...K} strokeWidth={4} />
      <path d="M -22 14 L 22 14 L 30 28 Q 32 38 22 38 L -22 38 Q -32 38 -30 28 Z" fill={c} />
    </g>
  ) : null;

// --- sfx ----------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "riser", 0.35],
  [PEAK - 6, "whoosh_long", 0.5],
  [PEAK, "impact", 0.8],
  [T.battery, "buzz", 0.3],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [T.labs23 + i * 4, "pop", 0.25]),
  [T.drain1, "thud", 0.4],
  [T.why, "boing", 0.35],
  [T.test, "page", 0.4],
  [T.hard, "scribble", 0.4],
  [T.another, "ding", 0.4],
  [T.crash - 4, "swish", 0.35],
  [T.crash, "crash", 0.35],
  [T.people, "tick", 0.3],
  [T.people + 18, "kaching", 0.35],
  [T.drain - 16, "riser", 0.5],
  [T.drain, "impact", 0.7],
  [T.zero, "freeze", 0.45],
  [T.zero + 10, "whoosh", 0.45],
  [T.y2021, "page", 0.4],
  [T.same, "stamp", 0.65],
  [T.setup, "swish", 0.35],
  [T.argue, "boing", 0.3],
  [T.stop, "slam", 0.5],
  [T.easy, "ding", 0.45],
  [T.start, "gold", 0.45],
  [T.batt, "whoosh", 0.4],
  [LOOP - 8, "buzz", 0.35],
];

export const S01Battery: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // battery: 3% at frame 0 (crack from the beam), fades during the tests, back for the re-hook, peels on "zero"
  const level =
    f < T.batt
      ? 0.03
      : interpolate(f, [T.batt, T.hundred, T.hundred + 14, LOOP + 6], [0.03, 1, 1, 0.03], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const crack = f < T.batt - 4 ? interpolate(f, [PEAK, PEAK + 6], [0, 1], clamp) : 0;
  const peel = f < T.batt - 4 ? interpolate(f, [T.zero + 8, T.zero + 34], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const battK = Math.max(win(f, -10, T.labs23, 6), win(f, T.zero + 4, T.y2021 - 4, 4), interpolate(f, [T.batt - 4, T.batt + 4], [0, 1], clamp));
  const battShake = f >= PEAK && f < PEAK + 12 ? Math.sin(f * 2.4) * (PEAK + 12 - f) : 0;

  // 23 flasks
  const flaskK = win(f, T.labs23 - 2, T.test, 6);
  // round 1 / round 2 panels
  const roundsK = win(f, T.test - 4, T.zero + 10, 6);
  const r2 = interpolate(f, [T.then - 4, T.then + 4], [0, 1], clamp);
  const crashH = interpolate(f, [T.crash - 6, T.crash + 6], [1, 0.35], { ...clamp, easing: Easing.in(Easing.cubic) });
  // counter
  const n = Math.round(interpolate(f, [T.people, T.later + 6], [0, 2141], { ...clamp, easing: Easing.out(Easing.cubic) }));
  // result bars (re-hook)
  const realH = interpolate(f, [T.drain - 4, T.zero - 2], [0.35, 0.96], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  // 2021 card
  const card21K = win(f, T.y2021 - 4, T.setup - 2, 6);
  // caveat
  const cavK = win(f, T.setup - 2, T.stop - 2, 6);
  // payoff
  const payK = win(f, T.stop - 2, T.batt, 6);
  const step = interpolate(f, [T.make, T.easy], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  const overlayK = Math.max(interpolate(f, [T.labs23 - 8, T.labs23], [1, 0], clamp), interpolate(f, [LOOP - 6, LOOP], [0, 1], clamp));

  const sparkKeys = gestureKeys([
    [0, { ...G.pointSide, ra1: 80 }],
    [PEAK - 4, { ...G.pointSide, ra1: 95, lean: 8 }],
    [PEAK, { ...G.pointSide, lean: -6 }, "snap"],
    [T.plan, G.leanIn, "snap"],
    [T.battery, G.pointSide, "snap"],
    [T.labs23, G.presentBoth, "snap"],
    [T.drain1, G.shrugBig, "snap"],
    [T.why, G.thinkChin, "snap"],
    [T.test, G.count1, "snap"],
    [T.then, G.count2, "snap"],
    [T.drains, G.pointUp, "snap"],
    [T.crash, G.recoil, "snap"],
    [T.people, G.pointSide, "snap"],
    [T.drain, G.leanIn, "snap"],
    [T.zero, G.mindBlown, "snap"],
    [T.bigger, G.doublePoint, "snap"],
    [T.same, G.handsHips, "snap"],
    [T.setup, G.stop, "snap"],
    [T.scientists, G.armsCrossed, "snap"],
    [T.stop, G.fistPump, "snap"],
    [T.make, G.present, "snap"],
    [T.start, G.celebrate, "snap"],
    [T.batt, G.pointSide, "snap"],
    [LOOP, { ...G.pointSide, ra1: 80 }, "snap"],
  ]);
  const mood = (t: number): Mood =>
    t < PEAK ? "determined" : t < T.labs23 ? "smug" : t < T.why ? "curious" : t < T.test ? "thinking" : t < T.drains ? "excited" : t < T.people ? "worried" : t < T.drain ? "curious" : t < T.bigger ? "mindblown" : t < T.setup ? "smug" : t < T.stop ? "skeptical" : t < T.batt ? "happy" : t < LOOP ? "wink" : "determined";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.zero, 34), bulbPulse(t, T.easy, 24) * 0.8);
  const z = punch(f, [T.crash, T.zero, T.same, T.start], 0.035);

  return (
    <Stage
      bg={<Station f={f} />}
      hits={[...powerHits("beam", 0), T.crash, T.zero, T.same]}
      power={11}
      cam={{ z }}
      svg={
        <>
          <PowerUp kind="beam" f={f} at={0} x={SX} y={GROUND} h={185 * SS} dir={-1} tx={BX + 60} ty={BY - 40} layer="back" color={LIME} />
          {battK > 0.01 && (
            <g opacity={battK} transform={`translate(${battShake} 0)`}>
              <Battery f={f} level={level} peel={peel} crack={crack} />
            </g>
          )}
          {f >= PEAK && f < PEAK + 16 && <Burst x={BX + 60} y={BY - 40} at={PEAK} f={f} size={340} color={LIME} />}

          {/* 23 flasks */}
          {flaskK > 0.01 && (
            <g opacity={flaskK}>
              {Array.from({ length: 23 }, (_, i) => (
                <Flask key={i} x={150 + (i % 6) * 110} y={720 + Math.floor(i / 6) * 130} k={1.2 * pop(f, T.labs23 + i * 1.2)} c={[LIME, CYAN, PINK][i % 3]} />
              ))}
            </g>
          )}

          {/* ROUND 1 / ROUND 2 + prediction */}
          {roundsK > 0.01 && (
            <g opacity={roundsK}>
              {f < T.drains ? (
                <>
                  <g transform={`translate(260 940) scale(${pop(f, T.test - 2)})`}>
                    <rect x={-170} y={-230} width={340} height={460} rx={22} fill="#fff" {...K} strokeWidth={7} />
                    <text y={-170} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill={INK}>
                      ROUND 1
                    </text>
                    {["t h e a e r e", "e l s e w h e", "n e e d e t e"].map((row, i) => (
                      <text key={i} y={-80 + i * 70} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={42} fill="#555">
                        {row}
                      </text>
                    ))}
                    <path d={`M -120 -95 L ${-120 + 240 * interpolate(f, [T.hard, T.then], [0, 1], clamp)} -95`} stroke={RED} strokeWidth={8} />
                    <text y={190} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={INK}>
                      HARD TASK
                    </text>
                  </g>
                  {r2 > 0.01 && (
                    <g transform={`translate(600 940) scale(${pop(f, T.then - 2)})`}>
                      <rect x={-150} y={-230} width={300} height={460} rx={22} fill="#fff" {...K} strokeWidth={7} />
                      <text y={-170} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill={INK}>
                        ROUND 2
                      </text>
                      <circle r={80} cy={10} fill={Math.floor(f / 10) % 2 ? LIME : "#ddd"} {...K} strokeWidth={6} />
                      <text y={190} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={INK}>
                        REACTION TEST
                      </text>
                    </g>
                  )}
                </>
              ) : (
                <g transform={`translate(0 0) scale(1)`}>
                  {/* prediction bars */}
                  <line x1={110} y1={1200} x2={760} y2={1200} stroke="#fff" strokeWidth={6} />
                  <rect x={170} y={1200 - 440} width={200} height={440} fill={CYAN} {...K} strokeWidth={6} />
                  {f < T.drain - 4 ? (
                    <rect x={480} y={1200 - 440 * crashH} width={200} height={440 * crashH} fill={RED} {...K} strokeWidth={6} strokeDasharray="20 10" />
                  ) : (
                    <rect x={480} y={1200 - 440 * realH} width={200} height={440 * realH} fill={LIME} {...K} strokeWidth={6} />
                  )}
                  <text x={270} y={1250} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill="#fff">
                    ROUND 1
                  </text>
                  <text x={580} y={1250} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill="#fff">
                    ROUND 2
                  </text>
                  <text x={580} y={1200 - 440 * (f < T.drain - 4 ? crashH : realH) - 24} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={f < T.drain - 4 ? RED : LIME}>
                    {f < T.drain - 4 ? "PREDICTED" : "ACTUAL"}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 2021 card */}
          {card21K > 0.01 && (
            <g opacity={card21K} transform={`translate(420 960) scale(${pop(f, T.y2021 - 4)}) rotate(-3)`}>
              <rect x={-300} y={-230} width={600} height={460} rx={26} fill="#fff" {...K} strokeWidth={8} />
              <text y={-130} textAnchor="middle" fontFamily={FONT.comic} fontSize={90} fill={V2}>
                2021
              </text>
              <text y={-40} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={46} fill={INK}>
                36 LABS · 3,531 PEOPLE
              </text>
              <text y={50} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={46} fill={INK}>
                d = 0.06 (not significant)
              </text>
            </g>
          )}

          {/* caveat: two scientists arguing */}
          {cavK > 0.01 && (
            <g opacity={cavK}>
              {[
                { x: 230, c: COL.blue, l: "DEPLETION IS REAL", s: 1 },
                { x: 600, c: "#b9b9c9", l: "NOT IN THIS TEST", s: -1 },
              ].map((p, i) => (
                <g key={i}>
                  <Actor f={f} color={p.c} scale={1.4} face={i ? "angry" : "happy"} base={{ x: p.x, y: GROUND - 92.5 * 1.4 }} facing={p.s} keys={[{ f: 0, p: { ra1: 100, ra2: 20, la1: -20 } }, { f: T.argue, p: { ra1: 150, ra2: 40, la1: -30 } }]} mod={(t, q) => addPose(q, idle(t, i + 5))} />
                  <g transform={`translate(${p.x + (i ? -40 : 40)} ${GROUND - 380}) scale(${pop(f, T.scientists + i * 6)})`}>
                    <rect x={-170} y={-50} width={340} height={80} rx={20} fill="#fff" {...K} strokeWidth={5} />
                    <text y={6} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={28} fill={INK}>
                      {p.l}
                    </text>
                  </g>
                </g>
              ))}
            </g>
          )}

          {/* payoff: shrink step 1 */}
          {payK > 0.01 && f >= T.make - 4 && (
            <g opacity={payK}>
              <rect x={110} y={GROUND - 560} width={320} height={560} rx={10} fill={PINK} {...K} strokeWidth={8} />
              <text x={270} y={GROUND - 480} textAnchor="middle" fontFamily={FONT.comic} fontSize={54} fill="#fff" stroke={INK} strokeWidth={4} paintOrder="stroke">
                HARD TASK
              </text>
              {[0, 1, 2, 3].map((i) => {
                const k = interpolate(step, [i * 0.2, i * 0.2 + 0.3], [0, 1], clamp);
                const hh = 140 * (4 - i);
                return k > 0.01 ? <rect key={i} x={430 + i * 85} y={GROUND - hh * k} width={85} height={hh * k} fill={LIME} {...K} strokeWidth={6} /> : null;
              })}
              {step > 0.9 && (
                <text x={560} y={GROUND - 600} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={LIME}>
                  STEP 1: JUST OPEN IT
                </text>
              )}
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
              let q = addPose(p, idle(t, 6));
              q = addPose(addPose(q, hop(t, T.zero, 36)), hop(t, T.start, 44));
              q = addPose(addPose(q, shake(t, T.argue)), nod(t, T.same));
              return q;
            }}
          />
          <PowerUp kind="beam" f={f} at={0} x={SX} y={GROUND} h={185 * SS} dir={-1} tx={BX + 60} ty={BY - 40} layer="front" color={LIME} />
        </>
      }
      html={
        <>
          <div style={{ position: "absolute", right: 70, top: 262, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: "#fff", letterSpacing: 2, opacity: 0.85 }}>HIDDEN MECHANISM · HACK H14</div>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 470, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 130, color: "#fff", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", lineHeight: 1 }}>WILLPOWER:</div>
              <div style={{ display: "inline-block", marginTop: 8, background: RED, color: "#fff", padding: "4px 34px", fontFamily: FONT.comic, fontSize: 110, border: `6px solid ${INK}` }}>3% LEFT</div>
            </div>
          )}
          {flaskK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 470, transform: `translate(-50%,-50%) scale(${pop(f, T.labs23)})`, opacity: flaskK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 150, color: LIME, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", lineHeight: 1 }}>23 LABS</div>
              {f >= T.why && <div style={{ display: "inline-block", fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: "#fff", background: INK, padding: "2px 18px" }}>ALMOST NO DRAIN. WHY?</div>}
            </div>
          )}
          <Slam f={f} at={T.test} out={T.drains - 4} x={540} y={470} size={110} color={CYAN} stroke={`10px ${INK}`} rotate={-2}>
            THE TEST
          </Slam>
          <Slam f={f} at={T.drains} out={T.people - 4} x={540} y={470} size={96} color={RED} stroke={`10px #fff`} rotate={2}>
            ROUND 2 SHOULD CRASH
          </Slam>
          {f >= T.people - 2 && f < T.bigger && (
            <div style={{ position: "absolute", left: 540, top: 470, transform: `translate(-50%,-50%) scale(${pop(f, T.people - 2)})`, textAlign: "center", whiteSpace: "nowrap", opacity: interpolate(f, [T.bigger - 6, T.bigger], [1, 0], clamp) }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 150, color: "#fff", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", lineHeight: 1 }}>{n.toLocaleString("en-US")}</div>
              <div style={{ display: "inline-block", fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: INK, background: f >= T.drain ? LIME : "#fff", padding: "2px 18px" }}>{f >= T.drain ? "DRAIN: d = 0.04 ≈ ZERO" : "PEOPLE · PREREGISTERED · 2016"}</div>
            </div>
          )}
          {f >= T.zero && f < T.bigger && <Stamp f={f} at={T.zero + 12} x={420} y={1180} text="MYTH" color={RED} size={120} r={-10} />}
          <div style={{ position: "absolute", inset: 0, opacity: interpolate(f, [T.setup - 6, T.setup], [1, 0], clamp) }}>
            <Stamp f={f} at={T.same} x={700} y={1180} text="SAME" color={LIME} size={110} r={8} />
          </div>
          {cavK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 470, transform: `translate(-50%,-50%) scale(${pop(f, T.setup - 2)}) rotate(-2deg)`, opacity: cavK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 120, color: "#fff", WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill", lineHeight: 1 }}>CATCH:</div>
              <div style={{ display: "inline-block", fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: INK, background: "#fff", padding: "4px 20px" }}>ONE SETUP · DEBATE CONTINUES</div>
            </div>
          )}
          <Slam f={f} at={T.stop} out={T.make - 4} x={540} y={470} size={104} color={PINK} stroke={`10px ${INK}`} rotate={-3}>
            STOP RATIONING
          </Slam>
          <Slam f={f} at={T.make} out={T.batt - 4} x={540} y={470} size={96} color={LIME} stroke={`10px ${INK}`} rotate={2}>
            MAKE STEP 1 TINY
          </Slam>
          <div style={{ position: "absolute", left: 540, top: 1720, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: "#fff", whiteSpace: "nowrap", background: "rgba(22,10,51,0.75)", padding: "2px 12px" }}>
            Hagger et al. 2016, Perspect Psychol Sci · Vohs et al. 2021, Psychol Sci
          </div>
          <VoiceCaptions
            f={f}
            y={1480}
            cues={VOICE_CUES}
            hi={["willpower", "battery.", "twenty-three", "drain.", "why?", "hard", "crash.", "thousand", "zero.", "bigger", "same", "setup,", "argue.", "rationing", "easy", "start.", "hundred"]}
          />
        </>
      }
    />
  );
};
