import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, walkCycle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { POWER_PEAK, PowerUp, powerHits } from "../shared/powerup";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H03 · One-minute huffing bursts (VILPA). Retention v2 cut (29 s). 8-bit video-game level: pixel sky, blocky
// clouds, brick ground, BURSTS HUD. Frame 0: YOU (orange player) mid-staircase under "3 MINUTES. NO GYM." while
// Spark DASHES in from the right (power-up "dash"; V013 before it used "charge"). LVL 1 STAIRS / LVL 2 BUS DASH /
// LVL 3 HEAVY BAGS, tracker + 25,241 counter, ×3 coins, re-hook: risk bar shrinks ≈ −40%, pixel heart ≈ −49%,
// magnifier caveat, three level badges ticked, "Third burst…" cuts back to the staircase (frame 0).
// Stamatakis et al. 2022, Nature Medicine (UK Biobank, n = 25,241 non-exercisers). Education, not medical advice.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const YS = 1.5;
const YGY = GROUND - 92.5 * YS;
const SKY1 = "#5ad1ff";
const SKY2 = "#2a6df4";
const BRICK = "#d8572a";
const BRICK2 = "#a83c17";
const COIN = "#ffd23f";
const PIX = "#7cf06a";
const RED = "#ff3b5c";
const NAVY = "#1b1f4b";
const PEAK = POWER_PEAK.dash; // 8

const T = {
  never: W(0, 1),
  three: W(0, 3),
  bursts: W(0, 5),
  count: W(0, 10),
  how: W(0, 11),
  hide: C(1),
  already: W(1, 5),
  stairs: C(2),
  dash: W(2, 2),
  bus: W(2, 5),
  heavy: W(2, 6),
  bags: W(2, 7),
  n25: C(3),
  trackers: W(3, 4),
  ones: C(4),
  threeA: W(4, 4),
  linked: W(5, 1),
  forty: W(5, 4),
  death: W(5, 9),
  heart: C(6),
  half: W(6, 3),
  obs: W(7, 1),
  healthier: W(7, 3),
  move: W(7, 7),
  pick: W(8, 1),
  threeB: W(8, 3),
  today: W(8, 5),
  third: C(9),
};
const LOOP = VOICE_FRAMES - 14;

// --- background: 8-bit level ---------------------------------------------------------------------------
const Level: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }} shapeRendering="crispEdges">
      <defs>
        <linearGradient id="h03sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SKY2} />
          <stop offset="100%" stopColor={SKY1} />
        </linearGradient>
        <pattern id="h03brick" width="80" height="40" patternUnits="userSpaceOnUse">
          <rect width="80" height="40" fill={BRICK} />
          <rect x="0" y="0" width="80" height="4" fill={BRICK2} />
          <rect x="0" y="20" width="80" height="4" fill={BRICK2} />
          <rect x="38" y="0" width="4" height="20" fill={BRICK2} />
          <rect x="0" y="20" width="4" height="20" fill={BRICK2} />
        </pattern>
      </defs>
      <rect width={1080} height={1920} fill="url(#h03sky)" />
      {/* pixel clouds drifting */}
      {[0, 1, 2].map((i) => {
        const x = ((i * 420 + f * (0.6 + i * 0.25)) % 1400) - 250;
        const y = 300 + i * 150;
        return (
          <g key={i} transform={`translate(${x} ${y})`} fill="#fff" opacity={0.9}>
            <rect x={0} y={20} width={180} height={40} />
            <rect x={30} y={0} width={110} height={30} />
            <rect x={60} y={-16} width={50} height={20} />
          </g>
        );
      })}
      {/* distant pixel hills */}
      {[[120, 220], [520, 300], [900, 240]].map(([x, h], i) => (
        <g key={i}>
          <rect x={x - 140} y={GROUND - h + 80} width={280} height={h} fill="#2fb36b" />
          <rect x={x - 100} y={GROUND - h + 40} width={200} height={60} fill="#2fb36b" />
          <rect x={x - 50} y={GROUND - h + 10} width={100} height={40} fill="#2fb36b" />
        </g>
      ))}
      {/* brick ground */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="url(#h03brick)" />
      <rect x={0} y={GROUND} width={1080} height={10} fill={NAVY} />
    </svg>
  </AbsoluteFill>
);

const Block: React.FC<{ x: number; y: number; w: number; h: number; col?: string }> = ({ x, y, w, h, col = BRICK }) => (
  <g shapeRendering="crispEdges">
    <rect x={x} y={y} width={w} height={h} fill={col} stroke={NAVY} strokeWidth={6} />
    <rect x={x + 6} y={y + 6} width={w - 12} height={8} fill="#fff" opacity={0.25} />
  </g>
);

const Coin: React.FC<{ x: number; y: number; k: number; spin: number }> = ({ x, y, k, spin }) =>
  k > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${k * Math.max(0.15, Math.abs(Math.cos(spin)))} ${k})`} shapeRendering="crispEdges">
      <rect x={-34} y={-46} width={68} height={92} fill={COIN} stroke={NAVY} strokeWidth={6} />
      <rect x={-8} y={-28} width={16} height={56} fill="#e0a800" />
    </g>
  ) : null;

const PixelHeart: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => {
  const m = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"];
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} shapeRendering="crispEdges">
      {m.flatMap((row, r) =>
        row.split("").map((c, i) => (c === "1" ? <rect key={`${r}-${i}`} x={(i - 3.5) * 34} y={(r - 3) * 34} width={34} height={34} fill={RED} stroke={NAVY} strokeWidth={3} /> : null)),
      )}
    </g>
  );
};

// --- sfx ----------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "whoosh", 0.5],
  [PEAK, "punch", 0.6],
  [T.three, "pop", 0.35],
  [T.how, "boing", 0.35],
  [T.hide, "swish", 0.35],
  ...Array.from({ length: 4 }, (_, i): SfxCue => [T.stairs + i * 5, "tick", 0.3]),
  [T.dash, "swish", 0.45],
  [T.bus, "horn", 0.25],
  [T.bags, "thud", 0.5],
  [T.n25 - 4, "ding", 0.35],
  [T.n25 + 14, "kaching", 0.4],
  [T.threeA, "clink", 0.4],
  [T.threeA + 6, "clink", 0.4],
  [T.threeA + 12, "kaching", 0.45],
  [T.forty - 22, "riser", 0.5],
  [T.forty, "impact", 0.8],
  [T.half, "impact", 0.55],
  [T.obs, "page", 0.4],
  [T.healthier, "swish", 0.35],
  [T.pick, "ding", 0.4],
  [T.threeB, "ding", 0.4],
  [T.today, "gold", 0.5],
  [T.third, "whoosh", 0.4],
];

// staircase geometry
const ST = Array.from({ length: 5 }, (_, i) => ({ x: 160 + i * 90, h: 60 + i * 60 }));
const STAIR_C0 = 0.45; // frame-0 climb position (loop target)

export const S01Levels: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // stairs + YOU: frame 0 → bags, then again at the loop
  const stairsK = Math.max(win(f, -10, T.dash, 5), f >= T.third - 6 ? interpolate(f, [T.third - 6, T.third], [0, 1], clamp) : 0);
  const busK = win(f, T.dash - 2, T.heavy, 5);
  const youK = Math.max(win(f, -10, T.n25, 6), f >= T.third - 6 ? interpolate(f, [T.third - 6, T.third], [0, 1], clamp) : 0);
  const busX = interpolate(f, [T.dash - 2, T.bus], [-500, 120], { ...clamp, easing: Easing.out(Easing.cubic) });
  const climbAt = (t: number) =>
    t < T.stairs ? STAIR_C0 : t < T.dash ? interpolate(t, [T.stairs, T.dash - 6], [STAIR_C0, 1], clamp) : interpolate(t, [T.third, LOOP], [0.15, STAIR_C0], clamp);
  const onStairs = (t: number) => t < T.dash || t >= T.third - 6;
  // crowd + counter
  const crowdK = win(f, T.n25 - 4, T.ones + 2, 6);
  const n = Math.round(interpolate(f, [T.n25, T.n25 + 20], [0, 25241], { ...clamp, easing: Easing.out(Easing.cubic) }));
  // coins
  const coinK = win(f, T.ones - 2, T.linked, 6);
  const coins = [0, 1, 2].map((i) => (f >= T.threeA + i * 6 ? pop(f, T.threeA + i * 6) : 0));
  // risk bar (re-hook)
  const riskK = win(f, T.linked - 4, T.obs, 6);
  const shrink = interpolate(f, [T.linked, T.forty], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pct = Math.round(shrink * 40);
  const heartK = f >= T.heart - 2 ? pop(f, T.heart - 2) : 0;
  const heartBeat = 1 + (f >= T.half ? Math.max(0, Math.sin((f - T.half) / 3)) * 0.06 : 0);
  // caveat
  const cavK = win(f, T.obs - 2, T.pick, 6);
  const arrowK = win(f, T.healthier - 2, T.pick, 6);
  // badges
  const bossK = win(f, T.pick - 2, T.third + 2, 6);
  const ticks = [T.pick + 4, T.threeB, T.today];
  const overlayK = Math.max(interpolate(f, [T.hide - 6, T.hide], [1, 0], clamp), interpolate(f, [T.third + 2, T.third + 8], [0, 1], clamp));
  const sparkX = (t: number) => interpolate(t, [0, PEAK], [1180, 910], { ...clamp, easing: Easing.out(Easing.cubic) });
  const bursts = f >= T.third ? 0 : f >= T.threeA ? Math.min(3, 1 + Math.floor((f - T.threeA) / 6)) : 0;

  const sparkKeys = gestureKeys([
    [0, G.leanIn],
    [PEAK - 2, G.leanIn],
    [PEAK, G.handsHips, "snap"],
    [T.never, G.pointSide, "snap"],
    [T.three, G.count1, "snap"],
    [T.how, G.shrugBig, "snap"],
    [T.hide, G.whisper, "snap"],
    [T.stairs, { ...G.pointSide, ra1: 110 }, "snap"],
    [T.bus, G.doublePoint, "snap"],
    [T.bags, G.recoil, "snap"],
    [T.n25, G.presentBoth, "snap"],
    [T.trackers, G.pointUp, "snap"],
    [T.threeA, G.clap1, "snap"],
    [T.threeA + 4, G.clap2],
    [T.linked, G.thinkChin, "snap"],
    [T.forty, G.mindBlown, "snap"],
    [T.half, G.pointDown, "snap"],
    [T.obs, G.stop, "snap"],
    [T.healthier, G.armsCrossed, "snap"],
    [T.pick, G.count2, "snap"],
    [T.today, G.celebrate, "snap"],
    [T.third, G.leanIn, "snap"],
    [LOOP, G.handsHips, "snap"],
  ]);
  const sparkMood = (t: number): Mood =>
    t < PEAK
      ? "determined"
      : t < T.never
        ? "smug"
        : t < T.hide
          ? "curious"
          : t < T.stairs
            ? "wink"
            : t < T.n25
              ? "excited"
              : t < T.linked
                ? "happy"
                : t < T.forty
                  ? "thinking"
                  : t < T.heart
                    ? "mindblown"
                    : t < T.obs
                      ? "shock"
                      : t < T.healthier
                        ? "skeptical"
                        : t < T.pick
                          ? "worried"
                          : t < T.third
                            ? "laugh"
                            : t < LOOP
                              ? "determined"
                              : "smug";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.forty, 34), bulbPulse(t, T.today, 24) * 0.8);
  const z = punch(f, [T.forty, T.half, T.today], 0.035);

  return (
    <Stage
      bg={<Level f={f} />}
      hits={[...powerHits("dash", 0), T.forty, T.today]}
      power={10}
      cam={{ z }}
      svg={
        <>
          {/* LVL 1 stairs */}
          {stairsK > 0.01 && (
            <g opacity={stairsK}>
              {ST.map((s, i) => (
                <Block key={i} x={s.x} y={GROUND - s.h} w={90} h={s.h} />
              ))}
            </g>
          )}
          {/* LVL 2 bus */}
          {busK > 0.01 && (
            <g opacity={busK} transform={`translate(${busX} 0)`} shapeRendering="crispEdges">
              <rect x={0} y={GROUND - 300} width={460} height={260} fill={COIN} stroke={NAVY} strokeWidth={8} />
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={24 + i * 105} y={GROUND - 270} width={84} height={80} fill="#bfe9ff" stroke={NAVY} strokeWidth={5} />
              ))}
              <rect x={0} y={GROUND - 150} width={460} height={22} fill={BRICK} />
              <text x={230} y={GROUND - 72} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill={NAVY}>
                BUS
              </text>
              {[80, 380].map((x) => (
                <rect key={x} x={x - 40} y={GROUND - 60} width={80} height={60} fill={NAVY} />
              ))}
            </g>
          )}

          {/* YOU: the player */}
          {youK > 0.01 && (
            <g opacity={youK}>
              <Actor
                f={f}
                color={COL.orange}
                scale={YS}
                label="YOU"
                face="happy"
                base={{ x: 300, y: YGY }}
                facing={1}
                keys={[
                  { f: 0, p: { ra1: 60, ra2: 30, la1: -60, la2: -30, lean: 10 } },
                  { f: T.heavy - 2, p: { ra1: 60, ra2: 30, la1: -60, la2: -30, lean: 10 } },
                  { f: T.heavy + 2, p: { ra1: 8, ra2: 0, la1: -8, la2: 0, lean: -2 } },
                  { f: T.third - 6, p: { ra1: 8, ra2: 0, la1: -8, la2: 0, lean: -2 } },
                  { f: T.third - 2, p: { ra1: 60, ra2: 30, la1: -60, la2: -30, lean: 10 } },
                ]}
                mod={(t, p) => {
                  let q = addPose(p, idle(t, 1));
                  if (onStairs(t)) {
                    const c = climbAt(t);
                    const step = Math.max(0, Math.min(4, Math.floor((40 + 360 * c) / 90)));
                    q = addPose(q, { ...walkCycle(t, 0.5), x: -100 + c * 360, y: -(step + 1) * 60 });
                  } else if (t < T.heavy) q = addPose(q, { ...walkCycle(t, 0.7), x: interpolate(t, [T.dash, T.heavy], [-80, 260], clamp), lean: 14 });
                  else q = addPose(q, { ...walkCycle(t, 0.25), x: 120 });
                  return q;
                }}
              >
                {(j) =>
                  f >= T.heavy && f < T.third - 6 ? (
                    <g shapeRendering="crispEdges">
                      <rect x={j.lHand[0] - 34} y={j.lHand[1]} width={68} height={80} fill="#f4f1e8" stroke={NAVY} strokeWidth={5} />
                      <rect x={j.rHand[0] - 34} y={j.rHand[1]} width={68} height={80} fill="#f4f1e8" stroke={NAVY} strokeWidth={5} />
                      <rect x={j.lHand[0] - 20} y={j.lHand[1] + 14} width={40} height={14} fill={PIX} />
                      <rect x={j.rHand[0] - 20} y={j.rHand[1] + 14} width={40} height={14} fill={RED} />
                    </g>
                  ) : null
                }
              </Actor>
              {/* puff clouds */}
              {[0, 1].map((i) => {
                const ph = (((f + i * 12) % 24) + 24) % 24 / 24;
                const hx = onStairs(f) ? 300 - 100 + climbAt(f) * 360 + 70 : f < T.heavy ? 300 + interpolate(f, [T.dash, T.heavy], [-80, 260], clamp) + 70 : 490;
                const hy = onStairs(f) ? YGY - 150 - (Math.max(0, Math.min(4, Math.floor((40 + 360 * climbAt(f)) / 90))) + 1) * 60 : YGY - 150;
                return <circle key={i} cx={hx + ph * 50} cy={hy - ph * 40} r={14 + ph * 18} fill="#fff" opacity={0.85 * (1 - ph)} stroke={NAVY} strokeWidth={3} />;
              })}
            </g>
          )}

          {/* tracker watch + crowd */}
          {crowdK > 0.01 && (
            <g opacity={crowdK}>
              <g transform={`translate(400 780) scale(${pop(f, T.n25 - 4)})`} shapeRendering="crispEdges">
                <rect x={-40} y={-120} width={80} height={240} fill="#4a4f66" stroke={NAVY} strokeWidth={5} />
                <rect x={-80} y={-70} width={160} height={140} rx={10} fill={NAVY} stroke="#fff" strokeWidth={6} />
                <polyline points="-60,10 -30,10 -15,-30 0,40 15,-10 30,10 60,10" fill="none" stroke={PIX} strokeWidth={7} />
              </g>
              {Array.from({ length: 40 }, (_, i) => {
                const k = pop(f, T.n25 + i * 0.6);
                const x = 120 + (i % 10) * 64;
                const y = 990 + Math.floor(i / 10) * 72;
                return (
                  <g key={i} transform={`translate(${x} ${y}) scale(${k})`} shapeRendering="crispEdges">
                    <rect x={-12} y={-44} width={24} height={24} fill="#fff" stroke={NAVY} strokeWidth={4} />
                    <rect x={-18} y={-18} width={36} height={40} fill={i % 7 === 3 ? COL.orange : "#9fb4ff"} stroke={NAVY} strokeWidth={4} />
                  </g>
                );
              })}
            </g>
          )}

          {/* ×3 coins */}
          {coinK > 0.01 && (
            <g opacity={coinK}>
              {coins.map((k, i) => (
                <Coin key={i} x={230 + i * 180} y={960} k={k * 1.7} spin={(f - T.threeA) / 14 + i * 0.4} />
              ))}
            </g>
          )}

          {/* risk bar (re-hook) */}
          {riskK > 0.01 && (
            <g opacity={riskK} shapeRendering="crispEdges">
              <rect x={110} y={900} width={640} height={110} fill="#fff" stroke={NAVY} strokeWidth={8} />
              <rect x={122} y={912} width={616 * (1 - 0.4 * shrink)} height={86} fill={RED} />
              {Array.from({ length: 10 }, (_, i) => (
                <rect key={i} x={122 + i * 61.6} y={912} width={4} height={86} fill={NAVY} opacity={0.25} />
              ))}
              <text x={110} y={880} fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={NAVY}>
                RISK OF DEATH (DURING THE STUDY)
              </text>
              {f >= T.forty && f < T.forty + 16 && <Burst x={500} y={955} at={T.forty} f={f} size={320} color={COIN} />}
              <PixelHeart x={430} y={1170} k={heartK * heartBeat * 0.9} />
            </g>
          )}

          {/* caveat magnifier */}
          {cavK > 0.01 && (
            <g opacity={cavK} transform={`translate(400 960) scale(${pop(f, T.obs - 2)})`}>
              <circle r={130} fill="#e7f6ff" stroke={NAVY} strokeWidth={14} />
              <rect x={80} y={80} width={40} height={150} fill={NAVY} transform="rotate(-45 100 100)" />
              <ellipse cx={0} cy={0} rx={70} ry={42} fill="#fff" stroke={NAVY} strokeWidth={8} />
              <circle r={26} fill={NAVY} />
            </g>
          )}

          {/* three level badges */}
          {bossK > 0.01 && (
            <g opacity={bossK}>
              {["STAIRS", "WALK", "BAGS"].map((lab, i) => {
                const y = 760 + i * 170;
                const k = pop(f, T.pick - 4 + i * 4);
                const done = f >= ticks[i];
                return (
                  <g key={lab} transform={`translate(400 ${y}) scale(${k * (done && f < ticks[i] + 8 ? 1.08 : 1)})`} shapeRendering="crispEdges">
                    <rect x={-270} y={-62} width={540} height={124} fill={done ? PIX : NAVY} stroke="#fff" strokeWidth={6} />
                    <text x={-240} y={20} fontFamily={FONT.comic} fontSize={54} fill={done ? NAVY : COIN}>
                      LVL {i + 1}
                    </text>
                    <text x={-70} y={22} fontFamily={FONT.comic} fontSize={64} fill={done ? NAVY : "#fff"}>
                      {lab}
                    </text>
                    {done && (
                      <text x={200} y={26} fontFamily={FONT.comic} fontSize={80} fill={NAVY}>
                        ✓
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* SPARK (right, facing left) — dashes in at frame 0 */}
          <PowerUp kind="dash" f={f} at={0} x={sparkX(f)} y={GROUND} h={185 * SS} dir={-1} layer="back" />
          <Spark
            f={f}
            scale={SS}
            base={{ x: 910, y: SGY }}
            facing={-1}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={-1}
            keys={sparkKeys}
            trails={f < PEAK + 4}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 4));
              q = addPose(q, { x: sparkX(t) - 910 });
              q = addPose(addPose(q, hop(t, T.stairs, 30)), hop(t, T.today, 46));
              q = addPose(addPose(q, shake(t, T.healthier)), nod(t, T.pick));
              return q;
            }}
          />
          <PowerUp kind="dash" f={f} at={0} x={910} y={GROUND} h={185 * SS} dir={-1} layer="front" />
        </>
      }
      html={
        <>
          {/* HUD + series tag */}
          <div style={{ position: "absolute", left: 70, top: 240, fontFamily: FONT.comic, fontSize: 40, color: "#fff", letterSpacing: 2, textShadow: `3px 3px 0 ${NAVY}` }}>
            BURSTS <span style={{ color: COIN }}>× {bursts}</span>
          </div>
          <div style={{ position: "absolute", right: 70, top: 248, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: "#fff", letterSpacing: 2, opacity: 0.85, textShadow: `2px 2px 0 ${NAVY}` }}>HIDDEN MECHANISM · HACK H03</div>
          {/* hook overlay (frame 0 + loop) */}
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 470, top: 470, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 150, color: COIN, WebkitTextStroke: `12px ${NAVY}`, paintOrder: "stroke fill", lineHeight: 1 }}>3 MINUTES.</div>
              <div style={{ display: "inline-block", marginTop: 6, background: NAVY, color: "#fff", padding: "4px 34px", fontFamily: FONT.comic, fontSize: 100, letterSpacing: 4 }}>
                NO <span style={{ color: RED }}>GYM.</span>
              </div>
            </div>
          )}
          <Slam f={f} at={T.hide} out={T.stairs - 3} x={470} y={460} size={110} color="#fff" stroke={`10px ${NAVY}`} rotate={2}>
            HIDDEN IN YOUR DAY
          </Slam>
          <Slam f={f} at={T.stairs} out={T.dash - 3} x={470} y={460} size={120} color={COIN} stroke={`10px ${NAVY}`} rotate={-2}>
            LVL 1: STAIRS
          </Slam>
          <Slam f={f} at={T.dash} out={T.heavy - 3} x={470} y={460} size={120} color={PIX} stroke={`10px ${NAVY}`} rotate={2}>
            LVL 2: BUS DASH
          </Slam>
          <Slam f={f} at={T.heavy} out={T.n25 - 3} x={470} y={460} size={120} color={RED} stroke={`10px #fff`} rotate={-2}>
            LVL 3: HEAVY BAGS
          </Slam>
          {crowdK > 0.01 && (
            <div style={{ position: "absolute", left: 470, top: 460, transform: `translate(-50%,-50%) scale(${pop(f, T.n25)})`, textAlign: "center", opacity: crowdK }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 150, color: COIN, WebkitTextStroke: `12px ${NAVY}`, paintOrder: "stroke fill", lineHeight: 1 }}>{n.toLocaleString("en-US")}</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: "#fff", background: NAVY, padding: "2px 18px", whiteSpace: "nowrap" }}>NON-EXERCISERS · WRIST TRACKERS</div>
            </div>
          )}
          <Slam f={f} at={T.ones} out={T.linked - 3} x={470} y={460} size={84} color={COIN} stroke={`10px ${NAVY}`} rotate={-2}>
            ~3 BURSTS · 1–2 MIN EACH
          </Slam>
          {riskK > 0.01 && f >= T.linked && (
            <div style={{ position: "absolute", left: 470, top: 470, transform: `translate(-50%,-50%) rotate(-3deg)`, textAlign: "center", opacity: riskK }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 170, color: PIX, WebkitTextStroke: `12px ${NAVY}`, paintOrder: "stroke fill", lineHeight: 1, transform: `scale(${f >= T.forty ? pop(f, T.forty) : 1})` }}>≈ −{pct}%</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 36, color: "#fff", background: NAVY, padding: "2px 16px", whiteSpace: "nowrap" }}>LINKED TO · ALL-CAUSE DEATH (38–40%)</div>
            </div>
          )}
          {heartK > 0.01 && riskK > 0.01 && (
            <div style={{ position: "absolute", left: 470, top: 1310, transform: `translate(-50%,-50%) scale(${heartK})`, opacity: riskK, fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: "#fff", background: RED, padding: "2px 18px", whiteSpace: "nowrap", border: `5px solid ${NAVY}` }}>
              HEART-DISEASE DEATH ≈ −49% (48–49%)
            </div>
          )}
          {f >= T.obs - 2 && f < T.pick && (
            <div style={{ position: "absolute", left: 470, top: 460, transform: `translate(-50%,-50%) scale(${pop(f, T.obs - 2)}) rotate(-2deg)`, opacity: interpolate(f, [T.pick - 6, T.pick], [1, 0], clamp), textAlign: "center" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 120, color: "#fff", WebkitTextStroke: `10px ${NAVY}`, paintOrder: "stroke fill", lineHeight: 1 }}>CATCH:</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 46, color: "#fff", background: NAVY, padding: "4px 20px", whiteSpace: "nowrap" }}>ONE STUDY · WATCHED, NOT TESTED</div>
            </div>
          )}
          {arrowK > 0.01 && (
            <div style={{ position: "absolute", left: 420, top: 1220, transform: `translate(-50%,-50%) scale(${pop(f, T.healthier - 2)})`, opacity: arrowK, fontFamily: FONT.title, fontWeight: 900, fontSize: 46, color: NAVY, background: "#fff", border: `6px solid ${NAVY}`, padding: "4px 18px", whiteSpace: "nowrap" }}>
              HEALTHIER ⇄ MOVE MORE?
            </div>
          )}
          <Slam f={f} at={T.pick} out={T.third - 4} x={470} y={460} size={130} color={COIN} stroke={`12px ${NAVY}`} rotate={-3}>
            PICK YOUR 3
          </Slam>
          <div style={{ position: "absolute", left: 540, top: 1690, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: "#fff", whiteSpace: "nowrap", background: "rgba(27,31,75,0.7)", padding: "2px 12px" }}>
            Stamatakis et al. 2022, Nature Medicine · UK Biobank · n = 25,241 · observational
          </div>
          <div style={{ position: "absolute", left: 540, top: 1738, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 800, fontSize: 27, color: "#fff", whiteSpace: "nowrap", textShadow: `2px 2px 0 ${NAVY}` }}>
            Education, not medical advice
          </div>
          <VoiceCaptions
            f={f}
            y={1480}
            cues={VOICE_CUES}
            hi={["never", "exercise", "three", "one-minute", "how", "stairs", "bus", "bags", "twenty-five", "trackers", "forty", "percent", "half", "observational", "healthier", "pick", "today", "third"]}
          />
        </>
      }
    />
  );
};
