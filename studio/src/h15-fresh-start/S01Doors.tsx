import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, runCycle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { POWER_PEAK, PowerUp, powerHits } from "../shared/powerup";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H15 · The Monday effect is real (fresh starts). Retention v2 cut (~24.7 s), Number Reveal, power-up "impact".
// World: a lilac "hall of calendar doors" (lilac wall, tangerine + magenta doors, chalk slate). Spark stands RIGHT.
// Frame 0: the MONDAY door blasts open (impact frame), light floods out, gym-goers sprint through: +33%.
// Then a row of closed doors with one huge "?" door (open loop), a gym-swipe counter to 11,912, doors that grow
// like bars (MONDAY 33 · MONTH 14 · YEAR 12), the SEMESTER door rockets to 47 (re-hook), a slate wiped clean,
// the catch (spike then dip: start ≠ stick), the payoff (circle a landmark + dip plan) and the next door glowing.
// Source: Dai, Milkman & Riis (2014), Management Science 60(10):2563–2582, Study 2 (gym attendance).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const SX = 890;
const LILAC = "#e7dcff";
const LILAC2 = "#c9b4f5";
const PLUM = "#3d2466";
const TANG = "#ff8a3d";
const MAG = "#e2368f";
const LIME = "#c6f04a";
const CHALK = "#2f3b36";
const PAPER = "#fffaf0";
const INK = COL.ink;
const PEAK = POWER_PEAK.impact; // 12

const T = {
  week: W(0, 4),
  gym: W(0, 5),
  jump: W(0, 7),
  n33: W(0, 8),
  but: C(1),
  beats: W(1, 3),
  monday: W(1, 4),
  mile: W(1, 7),
  they: C(2),
  tracked: W(2, 1),
  twelve: W(2, 3),
  students: W(2, 5),
  swipes: W(2, 7),
  newMonth: C(3),
  p14: W(3, 2),
  year: W(3, 4),
  p12: W(3, 6),
  newSem: C(4),
  n47: W(4, 2),
  fresh: C(5),
  clean: W(5, 5),
  slate: W(5, 6),
  catch: C(6),
  start: W(6, 4),
  last: W(6, 7),
  so: C(7),
  landmark: W(7, 3),
  plan: W(7, 5),
  dip: W(7, 8),
  next: C(8),
  door: W(8, 1),
  glows: W(8, 2),
};
const LOOP = VOICE_FRAMES - 16;
const DX = 420; // hero door centre
const DW = 300;
const DH = 600;

// --- background: lilac hall ------------------------------------------------------------------------------------
const Hall: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="h15wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={LILAC} />
          <stop offset="100%" stopColor={LILAC2} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#h15wall)" />
      {/* faint calendar grid on the wall */}
      {Array.from({ length: 7 }, (_, c) =>
        Array.from({ length: 5 }, (_, r) => (
          <g key={`${c}-${r}`} opacity={0.22}>
            <rect x={40 + c * 145} y={250 + r * 190} width={130} height={170} rx={10} fill="none" stroke={PLUM} strokeWidth={3} />
            <text x={52 + c * 145} y={285 + r * 190} fontFamily={FONT.title} fontWeight={800} fontSize={26} fill={PLUM}>
              {r * 7 + c + 1 <= 31 ? r * 7 + c + 1 : ""}
            </text>
          </g>
        )),
      )}
      {/* floating dust in the light */}
      {Array.from({ length: 24 }, (_, i) => (
        <circle key={i} cx={(random(`dx${i}`) * 1080 + f * (0.3 + random(`dv${i}`))) % 1080} cy={300 + random(`dy${i}`) * 900 + Math.sin(f / 20 + i) * 12} r={3 + random(`dr${i}`) * 3} fill="#fff" opacity={0.5} />
      ))}
      {/* floor */}
      <rect y={GROUND} width={1080} height={1920 - GROUND} fill={PLUM} />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={7} />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={540 + (i - 3.5) * 120} y1={GROUND} x2={540 + (i - 3.5) * 420} y2={1920} stroke="#ffffff" strokeWidth={3} opacity={0.08} />
      ))}
    </svg>
  </AbsoluteFill>
);

// --- props ------------------------------------------------------------------------------------------------------
// a door: x = centre, base = floor y; open = 0..1 (swings inward), glow = light behind it
const Door: React.FC<{ x: number; base: number; w: number; h: number; label: string; color: string; open?: number; glow?: number; labelSize?: number; sub?: string }> = ({
  x,
  base,
  w,
  h,
  label,
  color,
  open = 0,
  glow = 0,
  labelSize = 44,
  sub,
}) => {
  const top = base - h;
  const leaf = w * (1 - open * 0.85);
  return (
    <g>
      {/* frame */}
      <rect x={x - w / 2 - 16} y={top - 16} width={w + 32} height={h + 16} rx={10} fill="#fff" {...K} strokeWidth={6} />
      {/* light inside */}
      <rect x={x - w / 2} y={top} width={w} height={h} fill={glow > 0.01 ? "#fff4b8" : PLUM} />
      {glow > 0.01 && <rect x={x - w / 2} y={top} width={w} height={h} fill="#ffffff" opacity={glow * 0.7} />}
      {/* leaf */}
      <g>
        <rect x={x - w / 2} y={top} width={leaf} height={h} fill={color} {...K} strokeWidth={6} />
        {open < 0.6 && (
          <>
            <rect x={x - w / 2 + leaf * 0.14} y={top + h * 0.08} width={leaf * 0.72} height={h * 0.34} rx={6} fill="none" stroke={INK} strokeWidth={4} opacity={0.35} />
            <rect x={x - w / 2 + leaf * 0.14} y={top + h * 0.5} width={leaf * 0.72} height={h * 0.4} rx={6} fill="none" stroke={INK} strokeWidth={4} opacity={0.35} />
            <circle cx={x - w / 2 + leaf * 0.85} cy={top + h * 0.5} r={Math.max(6, w * 0.04)} fill="#ffd34d" stroke={INK} strokeWidth={4} />
          </>
        )}
      </g>
      {/* label plate above */}
      <g transform={`translate(${x} ${top - 46})`}>
        <rect x={-Math.max(w / 2 + 10, label.length * labelSize * 0.3 + 20)} y={-labelSize * 0.62} width={Math.max(w + 20, label.length * labelSize * 0.6 + 40)} height={labelSize * 1.2} rx={8} fill={PAPER} {...K} strokeWidth={5} />
        <text y={labelSize * 0.32} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={labelSize} fill={INK} letterSpacing={1}>
          {label}
        </text>
      </g>
      {sub && (
        <text x={x} y={top + h * 0.3} textAnchor="middle" fontFamily={FONT.comic} fontSize={Math.min(90, w * 0.5)} fill="#fff" stroke={INK} strokeWidth={6} paintOrder="stroke">
          {sub}
        </text>
      )}
    </g>
  );
};

const LightCone: React.FC<{ x: number; base: number; w: number; h: number; k: number }> = ({ x, base, w, h, k }) =>
  k > 0.01 ? (
    <path d={`M ${x - w / 2} ${base - h} L ${x + w / 2} ${base - h} L ${x + w * 1.6} ${base + 260} L ${x - w * 1.6} ${base + 260} Z`} fill="#fff4b8" opacity={0.45 * k} />
  ) : null;

// bar doors (door height = % boost)
const BAR_BASE = GROUND;
const barH = (v: number) => 140 + v * 12;
const BARS = [
  { key: "MONDAY", x: 150, v: 33.4, color: TANG },
  { key: "MONTH", x: 320, v: 14.4, color: MAG },
  { key: "YEAR", x: 490, v: 11.6, color: "#7b5cd6" },
  { key: "SEMESTER", x: 680, v: 47.1, color: "#ff5a5a" },
];

// --- sfx --------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "riser", 0.3],
  [PEAK, "impact", 0.75],
  [PEAK, "crash", 0.4],
  [T.gym, "whoosh", 0.4],
  [T.n33, "slam", 0.6],
  [T.but, "swish", 0.35],
  [T.beats, "boing", 0.3],
  [T.mile, "stinger", 0.45],
  [T.tracked, "whoosh", 0.35],
  ...Array.from({ length: 10 }, (_, i): SfxCue => [T.twelve - 6 + i * 4, "tick", 0.25]),
  [T.swipes, "ding", 0.45],
  [T.newMonth, "pop", 0.4],
  [T.p14, "pop", 0.45],
  [T.year, "pop", 0.4],
  [T.p12, "pop", 0.45],
  [T.newSem - 8, "riser", 0.55],
  [T.n47, "impact", 0.7],
  [T.n47, "gold", 0.45],
  [T.fresh, "swish", 0.4],
  [T.clean, "scribble", 0.4],
  [T.slate, "ding", 0.45],
  [T.catch, "buzz", 0.35],
  [T.start, "whoosh", 0.35],
  [T.last, "thud", 0.45],
  [T.landmark, "scribble", 0.4],
  [T.dip, "kaching", 0.45],
  [T.next, "swirl", 0.35],
  [LOOP - 6, "riser", 0.3],
];

export const S01Doors: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // windows
  const heroK = Math.max(win(f, -10, T.but, 6), interpolate(f, [T.next - 6, T.next + 2], [0, 1], clamp));
  const rowK = win(f, T.but - 2, T.they, 6);
  const swipeK = win(f, T.they - 2, T.newMonth, 6);
  const barsK = win(f, T.newMonth - 2, T.fresh, 6);
  const slateK = win(f, T.fresh - 2, T.catch, 6);
  const dipK = win(f, T.catch - 2, T.so, 6);
  const payK = win(f, T.so - 2, T.next, 6);

  const looping = f >= T.next - 6;
  const heroOpen = looping ? 0 : interpolate(f, [PEAK - 2, PEAK + 4], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const heroGlow = looping ? interpolate(f, [T.glows - 10, T.glows + 6], [0.2, 1], clamp) : interpolate(f, [0, PEAK], [0.15, 1], clamp);

  // swipe counter
  const swipes = Math.round(interpolate(f, [T.tracked, T.swipes], [0, 11912], { ...clamp, easing: Easing.out(Easing.cubic) }));

  // bars grow
  const grow = [
    interpolate(f, [T.newMonth - 4, T.newMonth + 6], [0, 1], clamp),
    interpolate(f, [T.newMonth, T.p14 + 4], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) }),
    interpolate(f, [T.year - 2, T.p12 + 4], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) }),
    interpolate(f, [T.newSem - 4, T.n47], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }),
  ];

  // slate wipe
  const wipe = interpolate(f, [W(5, 2), T.clean + 4], [0, 1], clamp);

  // dip line chart
  const lineP = interpolate(f, [T.catch + 4, T.last + 4], [0, 1], clamp);

  const overlayK = Math.max(interpolate(f, [T.but - 6, T.but + 2], [1, 0], clamp), interpolate(f, [LOOP - 6, LOOP], [0, 1], clamp));

  const sparkKeys = gestureKeys([
    [0, { ...G.pointSide, ra1: 95, ra2: 10, lean: -6 }],
    [PEAK - 3, { ...G.pointSide, ra1: 90, ra2: 6, lean: -2 }],
    [PEAK, { ...G.recoil }, "snap"],
    [T.gym, G.pointSide, "snap"],
    [T.n33, G.count1, "snap"],
    [T.but, G.leanIn, "snap"],
    [T.beats, G.doublePoint, "snap"],
    [T.mile, G.shrugBig, "snap"],
    [T.they, G.present, "snap"],
    [T.twelve, G.count2, "snap"],
    [T.newMonth, G.pointSide, "snap"],
    [T.year, G.thinkChin, "snap"],
    [T.newSem, G.leanIn, "snap"],
    [T.n47, G.mindBlown, "snap"],
    [T.fresh, G.wave1, "snap"],
    [T.clean, G.wave2, "snap"],
    [T.slate, G.celebrate, "snap"],
    [T.catch, G.stop, "snap"],
    [T.last, G.pointDown, "snap"],
    [T.so, G.presentBoth, "snap"],
    [T.plan, G.fistPump, "snap"],
    [T.next, { ...G.pointSide, ra1: 95, ra2: 10, lean: -6 }, "snap"],
  ]);
  const mood = (t: number): Mood =>
    t < PEAK ? "determined" : t < T.n33 ? "shock" : t < T.but ? "excited" : t < T.they ? "curious" : t < T.newMonth ? "thinking" : t < T.newSem ? "happy" : t < T.fresh ? "mindblown" : t < T.catch ? "laugh" : t < T.so ? "skeptical" : t < T.next ? "wink" : "determined";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.n47, 30), bulbPulse(t, T.slate, 20));
  const z = punch(f, [PEAK, T.n33, T.mile, T.n47, T.dip], 0.035);

  const runners = [0, 1, 2, 3];

  return (
    <Stage
      bg={<Hall f={f} />}
      hits={[...powerHits("impact", 0), T.n47]}
      power={11}
      cam={{ z }}
      svg={
        <>
          <PowerUp kind="impact" f={f} at={0} x={SX} y={GROUND} h={185 * SS} tx={DX} ty={GROUND - DH / 2} layer="back" />

          {/* hero door (frame 0 + loop) */}
          {heroK > 0.01 && (
            <g opacity={heroK}>
              <LightCone x={DX} base={GROUND} w={DW} h={DH} k={heroOpen * (looping ? 0 : 1)} />
              <Door x={DX} base={GROUND} w={DW} h={DH} label="MONDAY" color={TANG} open={heroOpen} glow={heroGlow} labelSize={60} />
              {looping && (
                <rect x={DX - DW / 2 - 30} y={GROUND - DH - 30} width={DW + 60} height={DH + 30} rx={20} fill="none" stroke="#fff4b8" strokeWidth={14} opacity={0.4 + 0.4 * Math.sin(f / 3)} />
              )}
              <Burst x={DX} y={GROUND - DH / 2} at={PEAK} f={f} size={360} color="#ffd34d" />
              {/* gym-goers sprint out of the light */}
              {!looping &&
                runners.map((i) => {
                  const st = PEAK + 4 + i * 9;
                  if (f < st) return null;
                  const d = f - st;
                  return (
                    <Actor
                      key={i}
                      f={f}
                      color={COL.grey}
                      scale={0.9 + d * 0.012}
                      face="happy"
                      base={{ x: DX - 60 + i * 40, y: GROUND - 92.5 * (0.9 + d * 0.012) }}
                      facing={i % 2 ? 1 : -1}
                      keys={[{ f: 0, p: {} }]}
                      opacity={interpolate(d, [0, 4, 40, 55], [0, 1, 1, 0], clamp)}
                      mod={(t, q) => addPose(addPose(q, runCycle(t + i * 5, 0.6)), { x: (i % 2 ? 1 : -1) * d * (3 + i) })}
                    />
                  );
                })}
              {f >= T.n33 && !looping && (
                <g transform={`translate(${DX} ${GROUND - DH + 170}) scale(${pop(f, T.n33)}) rotate(-4)`}>
                  <text textAnchor="middle" fontFamily={FONT.comic} fontSize={150} fill={LIME} stroke={INK} strokeWidth={10} paintOrder="stroke">
                    +33%
                  </text>
                </g>
              )}
            </g>
          )}

          {/* open loop: row of doors, one huge mystery door */}
          {rowK > 0.01 && (
            <g opacity={rowK}>
              {[
                ["MON", TANG, 110],
                ["1ST", MAG, 250],
                ["JAN 1", "#7b5cd6", 390],
              ].map(([l, c, x], i) => (
                <g key={i} transform={`translate(0 ${interpolate(f, [T.but + i * 4, T.but + i * 4 + 8], [400, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) })})`}>
                  <Door x={x as number} base={GROUND} w={110} h={300} label={l as string} color={c as string} labelSize={34} />
                </g>
              ))}
              <g transform={`translate(0 ${interpolate(f, [T.beats - 6, T.beats + 6], [700, 0], { ...clamp, easing: Easing.out(Easing.back(1.2)) })})`}>
                <Door x={620} base={GROUND} w={220} h={640} label="???" color="#ff5a5a" glow={0.5 + 0.5 * Math.sin(f / 4)} labelSize={48} sub="?" />
              </g>
              </g>
          )}

          {/* swipe counter */}
          {swipeK > 0.01 && (
            <g opacity={swipeK}>
              {/* turnstile */}
              <g transform={`translate(380 ${GROUND})`}>
                <rect x={-60} y={-330} width={120} height={330} rx={14} fill="#9aa3b5" {...K} strokeWidth={6} />
                <rect x={-40} y={-300} width={80} height={60} rx={8} fill={CHALK} stroke={INK} strokeWidth={4} />
                <circle cx={0} cy={-270} r={14} fill={f % 8 < 4 ? LIME : "#2a3a2a"} />
                {[0, 1, 2].map((i) => (
                  <line key={i} x1={0} y1={-190} x2={120 * Math.cos((f * 0.5 + i * 120) * (Math.PI / 180) * 6)} y2={-190 + 30 * Math.sin((f * 0.5 + i * 120) * (Math.PI / 180) * 6)} stroke={INK} strokeWidth={14} strokeLinecap="round" />
                ))}
                <text y={-140} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={INK}>
                  GYM
                </text>
              </g>
              {/* swipe card */}
              <g transform={`translate(${380 + Math.sin(f / 3) * 30} ${GROUND - 400}) rotate(-12)`}>
                <rect x={-90} y={-55} width={180} height={110} rx={12} fill={MAG} {...K} strokeWidth={5} />
                <rect x={-90} y={-30} width={180} height={22} fill={INK} />
                <text y={38} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={26} fill="#fff">
                  STUDENT ID
                </text>
              </g>
              <g transform={`translate(540 660) scale(${pop(f, T.they)})`}>
                <rect x={-300} y={-90} width={600} height={170} rx={20} fill={CHALK} {...K} strokeWidth={8} />
                <text y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={120} fill={LIME}>
                  {swipes.toLocaleString("en-US")}
                </text>
                <text y={130} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={PLUM}>
                  STUDENTS · 442 DAYS OF SWIPES
                </text>
              </g>
            </g>
          )}

          {/* bar doors */}
          {barsK > 0.01 && (
            <g opacity={barsK}>
              {BARS.map((b, i) => {
                const g = grow[i];
                if (g < 0.01) return null;
                const h = barH(b.v) * g;
                return (
                  <g key={b.key}>
                    <Door x={b.x} base={BAR_BASE} w={i === 3 ? 170 : 130} h={Math.max(40, h)} label={b.key} color={b.color} labelSize={i === 3 ? 40 : 32} glow={i === 3 ? 0.6 : 0.2} open={i === 3 ? interpolate(f, [T.n47, T.n47 + 8], [0, 0.6], clamp) : 0} />
                    {g > 0.6 && (
                      <text x={b.x} y={i === 3 ? BAR_BASE - h + 150 : BAR_BASE - h - 110} textAnchor="middle" fontFamily={FONT.comic} fontSize={i === 3 ? 96 : 64} fill={i === 3 ? LIME : "#fff"} stroke={INK} strokeWidth={8} paintOrder="stroke">
                        +{Math.round(b.v * Math.min(1, g))}%
                      </text>
                    )}
                  </g>
                );
              })}
              <Burst x={680} y={BAR_BASE - barH(47.1)} at={T.n47} f={f} size={320} color={LIME} />
            </g>
          )}

          {/* clean slate */}
          {slateK > 0.01 && (
            <g opacity={slateK} transform={`translate(470 900) scale(${pop(f, T.fresh - 2)})`}>
              <rect x={-330} y={-230} width={660} height={460} rx={18} fill="#a8743f" {...K} strokeWidth={8} />
              <rect x={-300} y={-200} width={600} height={400} rx={10} fill={CHALK} />
              {/* scribbles of the old week, wiped left→right */}
              <g opacity={0.85}>
                <clipPath id="h15wipe">
                  <rect x={-300 + 600 * wipe} y={-200} width={600} height={400} />
                </clipPath>
                <g clipPath="url(#h15wipe)">
                  <text x={-260} y={-110} fontFamily={FONT.comic} fontSize={60} fill="#e8e8e8">
                    SKIPPED GYM ✗
                  </text>
                  <text x={-260} y={-20} fontFamily={FONT.comic} fontSize={60} fill="#e8e8e8">
                    "TOMORROW" ✗
                  </text>
                  <text x={-260} y={70} fontFamily={FONT.comic} fontSize={60} fill="#e8e8e8">
                    OLD ME
                  </text>
                </g>
              </g>
              {wipe > 0.9 && (
                <text y={40} textAnchor="middle" fontFamily={FONT.comic} fontSize={110} fill={LIME} opacity={interpolate(f, [T.slate, T.slate + 6], [0, 1], clamp)}>
                  NEW ME
                </text>
              )}
              {/* eraser */}
              {wipe > 0 && wipe < 1 && (
                <g transform={`translate(${-300 + 600 * wipe} ${Math.sin(f / 1.5) * 60})`}>
                  <rect x={-40} y={-70} width={80} height={140} rx={10} fill={TANG} {...K} strokeWidth={5} />
                </g>
              )}
            </g>
          )}

          {/* the catch: spike then dip */}
          {dipK > 0.01 && (
            <g opacity={dipK}>
              <rect x={90} y={640} width={680} height={560} rx={16} fill={PAPER} {...K} strokeWidth={6} />
              <line x1={140} y1={1130} x2={740} y2={1130} stroke={INK} strokeWidth={5} />
              <line x1={140} y1={700} x2={140} y2={1130} stroke={INK} strokeWidth={5} />
              <text x={160} y={1175} fontFamily={FONT.title} fontWeight={800} fontSize={30} fill={INK}>
                MON
              </text>
              <text x={600} y={1175} fontFamily={FONT.title} fontWeight={800} fontSize={30} fill={INK}>
                LATER
              </text>
              <clipPath id="h15line">
                <rect x={140} y={640} width={600 * lineP} height={560} />
              </clipPath>
              <path clipPath="url(#h15line)" d="M 140 1060 L 190 1060 L 210 760 Q 300 820 380 940 Q 480 1060 740 1070" fill="none" stroke={MAG} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
              {f >= T.start && (
                <g transform={`translate(240 740) scale(${pop(f, T.start)})`}>
                  <rect x={-80} y={-36} width={160} height={64} rx={10} fill={LIME} {...K} strokeWidth={5} />
                  <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={44} fill={INK}>
                    START
                  </text>
                </g>
              )}
              {f >= T.last && (
                <g transform={`translate(600 980) scale(${pop(f, T.last)})`}>
                  <rect x={-90} y={-36} width={180} height={64} rx={10} fill={MAG} {...K} strokeWidth={5} />
                  <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={44} fill="#fff">
                    THE DIP
                  </text>
                </g>
              )}
              <text x={430} y={700} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={28} fill={INK} opacity={0.7}>
                illustration · study measured starts, not streaks
              </text>
            </g>
          )}

          {/* payoff: circle a landmark + dip plan */}
          {payK > 0.01 && (
            <g opacity={payK}>
              <g transform={`translate(430 880) scale(${pop(f, T.so - 2)}) rotate(-2)`}>
                <rect x={-300} y={-220} width={600} height={440} rx={16} fill={PAPER} {...K} strokeWidth={7} />
                <rect x={-300} y={-220} width={600} height={80} rx={16} fill={MAG} {...K} strokeWidth={7} />
                <text y={-165} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill="#fff" letterSpacing={3}>
                  NEXT MONTH
                </text>
                {Array.from({ length: 21 }, (_, i) => (
                  <text key={i} x={-250 + (i % 7) * 83} y={-80 + Math.floor(i / 7) * 110} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={40} fill={INK}>
                    {i + 1}
                  </text>
                ))}
                {/* circle on the 1st */}
                <ellipse cx={-250} cy={-94} rx={46} ry={40} fill="none" stroke={TANG} strokeWidth={9} strokeDasharray={300} strokeDashoffset={300 * (1 - interpolate(f, [T.landmark - 4, T.landmark + 10], [0, 1], clamp))} />
                {/* dip plan note on week 3 */}
                {f >= T.plan - 2 && (
                  <g transform={`translate(110 150) scale(${pop(f, T.plan - 2)}) rotate(4)`}>
                    <rect x={-170} y={-50} width={340} height={100} rx={8} fill="#fff27a" {...K} strokeWidth={5} />
                    <text y={16} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill={INK}>
                      DIP PLAN ✓
                    </text>
                  </g>
                )}
              </g>
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
              let q = addPose(p, idle(t, 3));
              q = addPose(addPose(q, hop(t, T.n47, 36)), hop(t, T.slate, 26));
              q = addPose(addPose(q, shake(t, T.catch)), nod(t, T.dip));
              return q;
            }}
          />
          <PowerUp kind="impact" f={f} at={0} x={SX} y={GROUND} h={185 * SS} tx={DX} ty={GROUND - DH / 2} layer="front" />
        </>
      }
      html={
        <>
          <div style={{ position: "absolute", left: 80, top: 236, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: PLUM, letterSpacing: 2, opacity: 0.85 }}>LIFE HACK · HIDDEN MECHANISM</div>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 420, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ display: "inline-block", background: TANG, color: "#fff", padding: "6px 34px", fontFamily: FONT.comic, fontSize: 124, border: `7px solid ${INK}`, WebkitTextStroke: `4px ${INK}`, paintOrder: "stroke fill" }}>+33% ON MONDAYS</div>
            </div>
          )}
          <Slam f={f} at={T.but} out={T.they - 4} x={540} y={420} size={104} color={MAG} stroke={`9px #fff`} rotate={2}>
            ONE DAY BEATS IT
          </Slam>
          <Slam f={f} at={T.they} out={T.newMonth - 4} x={540} y={420} size={96} color={PLUM} stroke={`9px #fff`} rotate={-2}>
            11,912 GYM MEMBERS
          </Slam>
          <Slam f={f} at={T.newMonth} out={T.newSem - 4} x={540} y={420} size={100} color="#fff" stroke={`9px ${INK}`} rotate={2}>
            EVERY DOOR = A FRESH START
          </Slam>
          <Slam f={f} at={T.newSem} out={T.fresh - 4} x={540} y={420} size={120} color={LIME} stroke={`10px ${INK}`} rotate={-3}>
            NEW SEMESTER!
          </Slam>
          <Slam f={f} at={T.fresh} out={T.catch - 4} x={540} y={420} size={110} color="#fff" stroke={`9px ${INK}`} rotate={2}>
            CLEAN SLATE
          </Slam>
          <Slam f={f} at={T.catch} out={T.so - 4} x={540} y={420} size={110} color={MAG} stroke={`9px #fff`} rotate={-2}>
            START ≠ STICK
          </Slam>
          <Slam f={f} at={T.so} out={T.next - 4} x={540} y={420} size={96} color={TANG} stroke={`9px ${INK}`} rotate={2}>
            PICK A DOOR. PLAN THE DIP.
          </Slam>
          {f >= T.they - 4 && f < LOOP - 6 && (
            <div style={{ position: "absolute", left: 540, top: 1745, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: "#fff", whiteSpace: "nowrap" }}>
              Dai, Milkman & Riis 2014 (Mgmt Science) · one university gym, 2010–11 · vs. baseline
            </div>
          )}
          <VoiceCaptions
            f={f}
            y={1490}
            cues={VOICE_CUES}
            hi={["fresh", "monday", "thirtythree", "beats", "mile", "twelve", "thousand", "month", "fourteen", "year", "twelve", "semester", "fortyseven", "clean", "slate", "start", "last", "landmark", "dip"]}
          />
        </>
      }
    />
  );
};
