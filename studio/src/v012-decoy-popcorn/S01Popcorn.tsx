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

// V012 · Nobody buys the medium popcorn. Mechanism Reveal in a late-night cinema lobby (burgundy velvet,
// marquee bulbs, checker carpet). Three striped popcorn tubs on a candy counter; the MEDIUM hangs from
// puppet strings (the decoy). It makes the large look like a steal → DECOY stamp (wow). Receipt: a real
// magazine-ad test (print-only = print+web price): combo 84% with the decoy vs 32% without. Caveat: works
// best when you're torn. Payoff: cross the decoy out, compare the two you'd buy. Loop: the puppet bows.
// Popcorn prices are illustrative. Huber, Payne & Puto 1982; Ariely, Predictably Irrational (2008).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);

const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const RED = "#d62839";
const GOLD = "#ffc43d";
const CREAM = "#fff3d6";
const WINE = "#5a0f22";

// counter + tubs
const CTOP = 1075;
const TUBS = {
  small: { x: 430, w: 120, h: 150 },
  medium: { x: 640, w: 160, h: 215 },
  large: { x: 870, w: 190, h: 255 },
};

// --- anchors ----------------------------------------------------------------------------------------
const T = {
  think: W(0, 1),
  large: W(0, 5),
  medium1: W(1, 1),
  chose: W(1, 2),
  small: C(2),
  p150: W(2, 1),
  largeT: W(2, 3),
  p350: W(2, 4),
  tough: C(3),
  add: W(3, 3),
  medIn: W(3, 5),
  p330: W(3, 7),
  sudden: C(4),
  steal: W(4, 6),
  that: C(5),
  decoy: W(5, 4),
  nobody: C(6),
  smart: W(6, 7),
  mag: C(7),
  ad: W(7, 6),
  printOnly: C(8),
  same: W(8, 4),
  picked: C(9),
  withIt: W(9, 4),
  e84: C(10),
  combo: W(10, 4),
  without: C(11),
  t32: W(11, 3),
  works: C(12),
  torn: W(12, 5),
  so: C(13),
  cross: W(13, 1),
  decoy2: W(13, 3),
  compare: W(14, 1),
  two: W(14, 3),
  buy: W(14, 6),
};
const LOOP = VOICE_FRAMES - 22;

// --- background: cinema lobby ---------------------------------------------------------------------
const Lobby: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="v12wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a0710" />
          <stop offset="100%" stopColor="#6b1427" />
        </linearGradient>
        <pattern id="v12check" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="#2b1a3a" />
          <rect width="60" height="60" fill="#3d2752" />
          <rect x="60" y="60" width="60" height="60" fill="#3d2752" />
        </pattern>
      </defs>
      <rect width={1080} height={1920} fill="url(#v12wall)" />
      {/* soft spotlight on the counter */}
      <ellipse cx={660} cy={900} rx={520} ry={420} fill="#ff9fb0" opacity={0.08 + 0.02 * Math.sin(f / 20)} />
      {/* velvet curtains */}
      {[0, 1].map((side) => (
        <g key={side} transform={side ? "translate(1080 0) scale(-1 1)" : undefined}>
          <path d="M 0 0 L 120 0 Q 90 600 60 1290 L 0 1290 Z" fill="#8f1530" stroke={WINE} strokeWidth={6} />
          {[30, 70].map((x) => (
            <path key={x} d={`M ${x} 0 Q ${x - 14} 640 ${x - 22} 1290`} fill="none" stroke="#6e0f25" strokeWidth={8} />
          ))}
        </g>
      ))}
      {/* marquee bulbs */}
      <rect x={60} y={180} width={960} height={44} rx={22} fill="#3a0b17" stroke={GOLD} strokeWidth={5} />
      {Array.from({ length: 19 }, (_, i) => {
        const on = (Math.floor(f / 6) + i) % 3 !== 0;
        return <circle key={i} cx={90 + i * 50} cy={202} r={10} fill={on ? "#ffe9a3" : "#7a5a1d"} />;
      })}
      {/* carpet */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="url(#v12check)" />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
    </svg>
  </AbsoluteFill>
);

// --- props --------------------------------------------------------------------------------------------
// striped popcorn tub standing on (x, base), top width w, height h
const Tub: React.FC<{ x: number; base: number; w: number; h: number; glow?: number; seed?: number }> = ({ x, base, w, h, glow = 0, seed = 1 }) => {
  const bw = w * 0.74;
  const top = base - h;
  const n = 6;
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  const stripes = Array.from({ length: n }, (_, i) => {
    const a = i / n;
    const b = (i + 1) / n;
    const tx0 = lerp(x - w / 2, x + w / 2, a);
    const tx1 = lerp(x - w / 2, x + w / 2, b);
    const bx0 = lerp(x - bw / 2, x + bw / 2, a);
    const bx1 = lerp(x - bw / 2, x + bw / 2, b);
    return <path key={i} d={`M ${tx0} ${top} L ${tx1} ${top} L ${bx1} ${base} L ${bx0} ${base} Z`} fill={i % 2 ? "#fff" : RED} />;
  });
  const puffs = Array.from({ length: 9 }, (_, i) => {
    const px = x - w / 2 + 14 + ((w - 28) * i) / 8;
    const py = top - 10 - Math.abs(Math.sin(i * 1.7 + seed)) * 26 - (i > 1 && i < 7 ? 14 : 0);
    return <circle key={i} cx={px} cy={py} r={w * 0.12 + (i % 3) * 3} fill={CREAM} {...K} strokeWidth={4} />;
  });
  return (
    <g>
      {glow > 0.01 && <ellipse cx={x} cy={base - h / 2 - 20} rx={w * 1.05} ry={h * 0.9} fill={GOLD} opacity={0.35 * glow} />}
      {puffs}
      {stripes}
      <path d={`M ${x - w / 2} ${top} L ${x + w / 2} ${top} L ${x + bw / 2} ${base} L ${x - bw / 2} ${base} Z`} fill="none" {...K} strokeWidth={6} />
      <rect x={x - w / 2 - 6} y={top - 4} width={w + 12} height={16} rx={6} fill="#fff" {...K} strokeWidth={5} />
    </g>
  );
};

// --- sfx ----------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "pop", 0.4],
  [T.large, "ding", 0.4],
  [T.chose, "boing", 0.4],
  [T.small - 2, "swirl", 0.3],
  [T.p150, "clink", 0.4],
  [T.p350, "clink", 0.45],
  [T.medIn, "whoosh", 0.45],
  [T.medIn + 10, "thud", 0.5],
  [T.p330, "kaching", 0.4],
  [T.steal, "gold", 0.45],
  [T.decoy - 18, "riser", 0.4],
  [T.decoy, "stamp", 0.75],
  [T.smart, "ding", 0.35],
  [T.mag, "whoosh_long", 0.45],
  [T.same, "clink", 0.45],
  [T.picked, "buzz", 0.3],
  [T.e84 - 18, "riser", 0.45],
  [T.e84 + 12, "impact", 0.75],
  [T.t32, "swish", 0.45],
  [T.works, "whoosh", 0.4],
  [T.cross, "scribble", 0.5],
  [T.decoy2, "slam", 0.5],
  [T.two, "pop", 0.4],
  [LOOP, "swirl", 0.35],
];

export const S01Popcorn: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // phases: popcorn (0 → mag), magazine card (mag → works), popcorn again (works → end)
  const tubsK = Math.min(interpolate(f, [T.mag - 2, T.mag + 8], [1, 0], clamp) + interpolate(f, [T.works - 6, T.works + 6], [0, 1], clamp), 1);
  const cardK = interpolate(f, [T.mag, T.mag + 12, T.works - 6, T.works + 4], [0, 1, 1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });

  // medium tub vertical offset (0 = on the counter, negative = lifted on strings)
  const medY = (() => {
    if (f < T.small - 4) return interpolate(f, [T.chose, T.chose + 6, T.chose + 12, T.chose + 18], [0, -40, 0, -20], clamp);
    if (f < T.medIn) return interpolate(f, [T.small - 4, T.small + 8], [0, -1500], { ...clamp, easing: Easing.in(Easing.quad) });
    if (f < T.decoy2) return interpolate(f, [T.medIn, T.medIn + 10, T.medIn + 14, T.medIn + 18], [-1500, 0, -18, 0], clamp);
    if (f < LOOP) return interpolate(f, [T.decoy2, T.decoy2 + 16], [0, 700], { ...clamp, easing: Easing.in(Easing.quad) });
    return interpolate(f, [LOOP, LOOP + 10, LOOP + 14], [-1500, 0, -10], clamp);
  })();
  const medFallen = f >= T.decoy2 && f < LOOP;
  const bow = f >= LOOP ? interpolate(f, [LOOP + 12, LOOP + 16, VOICE_FRAMES - 4, VOICE_FRAMES], [0, -16, -16, 0], clamp) : 0;
  const stringsK = medFallen ? interpolate(f, [T.decoy2, T.decoy2 + 3], [1, 0], clamp) : 1;
  const dance = f >= T.chose && f < T.small ? Math.sin((f - T.chose) / 3) * 8 : 0;

  const largeGlow = Math.max(
    interpolate(f, [T.large, T.large + 6, T.chose, T.chose + 8], [0, 1, 1, 0], clamp),
    interpolate(f, [T.steal, T.steal + 6, T.mag - 4, T.mag], [0, 1, 1, 0], clamp),
  );
  const tag = (at: number) => (f >= at && f < LOOP + 6 ? pop(f, at) * interpolate(f, [LOOP, LOOP + 6], [1, 0], clamp) : 0);

  // card numbers
  const combo =
    f < T.without
      ? Math.round(interpolate(f, [T.e84 - 18, T.e84 + 12], [0, 84], { ...clamp, easing: Easing.out(Easing.cubic) }))
      : Math.round(interpolate(f, [T.t32 - 4, T.t32 + 10], [84, 32], { ...clamp, easing: Easing.inOut(Easing.quad) }));
  const web = f < T.without ? Math.round(interpolate(f, [T.e84 - 18, T.e84 + 12], [0, 16], clamp)) : Math.round(interpolate(f, [T.t32 - 4, T.t32 + 10], [16, 68], clamp));
  const printGone = interpolate(f, [T.without, T.without + 8], [0, 1], clamp);

  // SPARK
  const sparkKeys = gestureKeys([
    [0, G.thinkChin],
    [T.large, G.pointSide, "snap"],
    [T.medium1, G.whisper, "snap"],
    [T.small, G.present, "snap"],
    [T.largeT, { ...G.pointSide, ra1: 115 }, "snap"],
    [T.tough, G.thinkChin, "snap"],
    [T.add, G.beckon, "snap"],
    [T.steal, G.fistPump, "snap"],
    [T.decoy, G.mindBlown, "snap"],
    [T.nobody, G.armsCrossed, "snap"],
    [T.mag, G.pointUp, "snap"],
    [T.printOnly, G.pointSide, "snap"],
    [T.picked, G.shrugBig, "snap"],
    [T.e84, G.doublePoint, "snap"],
    [T.without, G.handsHips, "snap"],
    [T.works, G.shrugBig, "snap"],
    [T.cross, G.stop, "snap"],
    [T.compare, G.presentBoth, "snap"],
    [LOOP, G.clap1, "snap"],
    [LOOP + 6, G.clap2],
    [LOOP + 12, G.thinkChin],
  ]);
  const sparkMood = (t: number): Mood =>
    t < T.large
      ? "curious"
      : t < T.small
        ? "smug"
        : t < T.tough
          ? "happy"
          : t < T.add
            ? "thinking"
            : t < T.decoy
              ? "excited"
              : t < T.nobody + 10
                ? "mindblown"
                : t < T.mag
                  ? "skeptical"
                  : t < T.picked
                    ? "curious"
                    : t < T.e84
                      ? "laugh"
                      : t < T.without
                        ? "shock"
                        : t < T.works
                          ? "smug"
                          : t < T.cross
                            ? "worried"
                            : t < T.compare
                              ? "determined"
                              : t < LOOP
                                ? "wink"
                                : "laugh";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.decoy, 36), bulbPulse(t, T.e84 + 12, 24) * 0.8, bulbPulse(t, T.two, 18) * 0.6);

  const z = punch(f, [T.medIn + 10, T.decoy, T.e84 + 12, T.decoy2], 0.035);
  const hookK = Math.max(interpolate(f, [T.small - 8, T.small], [1, 0], clamp), interpolate(f, [LOOP + 4, LOOP + 12], [0, 1], clamp));

  const m = TUBS.medium;
  const medTop = CTOP + medY - m.h;
  const barY = medTop - 230;

  return (
    <Stage
      bg={<Lobby f={f} />}
      hits={[T.decoy, T.e84 + 12, T.decoy2]}
      power={9}
      cam={{ z }}
      svg={
        <>
          {/* counter */}
          <g opacity={tubsK}>
            <rect x={300} y={CTOP} width={760} height={GROUND - CTOP} fill="#f2e6cf" {...K} />
            <rect x={300} y={CTOP} width={760} height={26} fill="#c99a3a" {...K} />
            <rect x={330} y={CTOP + 60} width={700} height={140} rx={10} fill="#ffe7a8" opacity={0.35} stroke={COL.ink} strokeWidth={4} />
            {/* small + large */}
            <Tub x={TUBS.small.x} base={CTOP} w={TUBS.small.w} h={TUBS.small.h} seed={2} glow={0} />
            <g transform={`rotate(${f >= T.works && f < T.cross ? Math.sin((f - T.works) / 4) * 3 : 0} ${TUBS.large.x} ${CTOP})`}>
              <Tub x={TUBS.large.x} base={CTOP} w={TUBS.large.w} h={TUBS.large.h} seed={5} glow={largeGlow} />
            </g>
            {/* medium (the decoy) on puppet strings */}
            <g opacity={medFallen ? interpolate(f, [T.decoy2 + 8, T.decoy2 + 16], [1, 0], clamp) : 1}>
              {stringsK > 0.01 && (
                <g opacity={stringsK * (f < T.decoy - 30 && f > T.small + 10 && f < T.medIn ? 0 : 1)}>
                  {[-m.w / 2 + 8, 0, m.w / 2 - 8].map((dx, i) => (
                    <line key={i} x1={m.x + dx * 1.4 + dance} y1={barY} x2={m.x + dx} y2={medTop - (i === 1 ? 40 : 0)} stroke="#f3eadb" strokeWidth={3} opacity={0.9} />
                  ))}
                  <g transform={`rotate(${dance} ${m.x} ${barY})`}>
                    <rect x={m.x - 120} y={barY - 12} width={240} height={24} rx={8} fill="#b07a3c" {...K} strokeWidth={5} />
                    <rect x={m.x - 12} y={barY - 70} width={24} height={110} rx={8} fill="#b07a3c" {...K} strokeWidth={5} />
                  </g>
                </g>
              )}
              <g transform={`rotate(${dance * 0.6 + bow} ${m.x} ${CTOP + medY})`}>
                <Tub x={m.x} base={CTOP + medY} w={m.w} h={m.h} seed={3} />
              </g>
            </g>
            {/* cross-out */}
            {f >= T.cross && f < T.decoy2 + 16 && (
              <g opacity={interpolate(f, [T.decoy2 + 8, T.decoy2 + 16], [1, 0], clamp)}>
                {[
                  [m.x - 110, medTop - 30, m.x + 110, CTOP + 10],
                  [m.x + 110, medTop - 30, m.x - 110, CTOP + 10],
                ].map(([x1, y1, x2, y2], i) => {
                  const k = interpolate(f, [T.cross + i * 6, T.cross + i * 6 + 7], [0, 1], clamp);
                  return <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * k} y2={y1 + (y2 - y1) * k} stroke={RED} strokeWidth={22} strokeLinecap="round" />;
                })}
              </g>
            )}
            {/* VS between small and large */}
            {f >= T.two && f < LOOP + 6 && (
              <g transform={`translate(650 ${CTOP - 110}) scale(${pop(f, T.two)})`} opacity={interpolate(f, [LOOP, LOOP + 6], [1, 0], clamp)}>
                <circle r={62} fill={GOLD} {...K} strokeWidth={6} />
                <text y={20} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill={COL.ink}>
                  VS
                </text>
              </g>
            )}
            {f >= T.decoy && f < T.decoy + 16 && <Burst x={m.x} y={CTOP - 130} at={T.decoy} f={f} size={300} color={GOLD} />}
          </g>

          {/* SPARK */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 180, y: SGY }}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 5));
              q = addPose(addPose(q, hop(t, T.steal, 44)), hop(t, T.e84 + 12, 40));
              q = addPose(addPose(q, nod(t, T.same)), shake(t, T.picked));
              return addPose(q, nod(t, T.two));
            }}
          />
        </>
      }
      html={
        <>
          {/* price tags on the counter front */}
          {[
            ["SMALL", "₹150", TUBS.small.x, T.p150],
            ["MEDIUM", "₹330", TUBS.medium.x, T.p330],
            ["LARGE", "₹350", TUBS.large.x, T.p350],
          ].map(([name, price, x, at]) => {
            const k = tag(at as number) * tubsK;
            const isMed = name === "MEDIUM";
            const gone = isMed && medFallen ? interpolate(f, [T.decoy2 + 4, T.decoy2 + 12], [1, 0], clamp) : 1;
            return k > 0.01 ? (
              <div key={name as string} style={{ position: "absolute", left: x as number, top: CTOP + 128, transform: `translate(-50%,-50%) scale(${k})`, opacity: gone, textAlign: "center", background: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "4px 14px", minWidth: 150 }}>
                <div style={{ fontFamily: FONT.title, fontWeight: 800, fontSize: 30, color: "#7a2030", letterSpacing: 2 }}>{name}</div>
                <div style={{ fontFamily: FONT.comic, fontSize: 64, color: COL.ink, lineHeight: 1 }}>{price}</div>
                {isMed && f >= T.nobody && f < T.mag && (
                  <div style={{ position: "absolute", left: "50%", top: -40, transform: `translate(-50%,0) rotate(-6deg) scale(${pop(f, T.nobody)})`, fontFamily: FONT.title, fontWeight: 900, fontSize: 34, color: "#fff", background: RED, border: `4px solid ${COL.ink}`, borderRadius: 10, padding: "0 12px", whiteSpace: "nowrap" }}>SOLD: 0</div>
                )}
              </div>
            ) : null;
          })}
          {f >= T.decoy && f < T.mag && <Stamp f={f} at={T.decoy} x={TUBS.medium.x} y={CTOP - 120} text="DECOY" size={80} color={GOLD} r={-10} />}

          {/* hook overlay (frame 1 + loop) */}
          {hookK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 420, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: hookK, background: COL.ink, color: "#fff", borderRadius: 20, padding: "14px 40px", fontFamily: FONT.comic, fontSize: 104, letterSpacing: 3, lineHeight: 1.02, textAlign: "center", whiteSpace: "nowrap", border: `5px solid ${GOLD}` }}>
              WHO BUYS
              <br />
              <span style={{ color: GOLD }}>THE MEDIUM?</span>
            </div>
          )}
          <Slam f={f} at={T.tough} out={T.medIn - 4} x={540} y={420} size={104} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            +₹200? HMM…
          </Slam>
          <Slam f={f} at={T.steal} out={T.that - 2} x={540} y={420} size={104} color={GOLD} stroke={`9px ${COL.ink}`} rotate={2}>
            ONLY ₹20 MORE?!
          </Slam>
          <Slam f={f} at={T.smart} out={T.mag - 2} x={540} y={420} size={92} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            LARGE LOOKS SMART
          </Slam>
          <Slam f={f} at={T.mag} out={T.printOnly - 4} x={540} y={420} size={96} color={GOLD} stroke={`9px ${COL.ink}`} rotate={-2}>
            REAL AD, CLASS TEST
          </Slam>
          <Slam f={f} at={T.same} out={T.picked - 2} x={540} y={420} size={110} color="#fff" stroke={`9px ${COL.ink}`} rotate={2}>
            SAME PRICE?
          </Slam>
          <Slam f={f} at={T.picked} out={T.e84 - 4} x={540} y={420} size={110} color={RED} stroke={`9px #fff`} rotate={-2}>
            NOBODY: 0%
          </Slam>
          <Slam f={f} at={T.e84 + 12} out={T.without - 2} x={540} y={420} size={96} color={GOLD} stroke={`9px ${COL.ink}`} rotate={-2}>
            WITH THE DECOY
          </Slam>
          <Slam f={f} at={T.without} out={T.works - 4} x={540} y={420} size={96} color="#fff" stroke={`9px ${COL.ink}`} rotate={2}>
            WITHOUT IT
          </Slam>
          <Slam f={f} at={T.torn} out={T.cross - 2} x={540} y={420} size={86} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            WORKS BEST WHEN TORN
          </Slam>
          <Slam f={f} at={T.cross} out={T.compare - 2} x={540} y={420} size={104} color={RED} stroke={`9px #fff`} rotate={2}>
            CROSS IT OUT
          </Slam>
          <Slam f={f} at={T.compare} out={LOOP} x={540} y={420} size={92} color={GOLD} stroke={`9px ${COL.ink}`} rotate={-2}>
            COMPARE THESE 2
          </Slam>

          {/* the magazine-ad card */}
          {cardK > 0.01 && (
            <div style={{ position: "absolute", left: 670, top: 900, width: 650, transform: `translate(-50%,-50%) translateY(${(1 - cardK) * 700}px) rotate(1.5deg)`, background: "#fffaf0", border: `7px solid ${COL.ink}`, borderRadius: 22, padding: "22px 30px 26px", boxShadow: "0 16px 0 rgba(0,0,0,0.3)" }}>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 38, letterSpacing: 3, color: "#7a2030", textAlign: "center", marginBottom: 10 }}>MAGAZINE SUBSCRIPTION</div>
              {[
                { name: "Web only", price: "$59", pct: web, show: true },
                { name: "Print only", price: "$125", pct: 0, show: true, decoy: true },
                { name: "Print + web", price: "$125", pct: combo, show: true, best: true },
              ].map((r, i) => {
                const hiRow = (r.decoy || r.best) && f >= T.same && f < T.picked + 20;
                const strike = r.decoy ? printGone : 0;
                return (
                  <div key={i} style={{ position: "relative", padding: "12px 16px", marginTop: 10, borderRadius: 14, background: hiRow ? "#fff1b8" : r.best && f >= T.e84 ? "#e6f7e9" : "#fff", border: `4px solid ${COL.ink}`, opacity: 1 - strike * 0.55 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.body, fontWeight: 800, fontSize: 42, color: COL.ink }}>
                      <span>{r.name}</span>
                      <span>{r.price}</span>
                    </div>
                    {f >= T.picked && (
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
                        <div style={{ flex: 1, height: 34, background: "#eee", border: `3px solid ${COL.ink}`, borderRadius: 10, overflow: "hidden", position: "relative" }}>
                          <div style={{ width: `${r.pct}%`, height: "100%", background: r.best ? "#2fa84f" : r.decoy ? RED : "#2b7de9" }} />
                          {r.best && f >= T.without && <div style={{ position: "absolute", left: "84%", top: -4, bottom: -4, borderLeft: `5px dashed ${COL.ink}`, opacity: 0.6 }} />}
                        </div>
                        <div style={{ fontFamily: FONT.comic, fontSize: r.best ? 64 : 48, width: 120, textAlign: "right", color: r.best ? "#1f7a37" : COL.ink }}>{r.decoy && f >= T.without ? "—" : `${r.pct}%`}</div>
                      </div>
                    )}
                    {strike > 0.01 && <div style={{ position: "absolute", left: 10, right: 10, top: "50%", height: 10, background: RED, borderRadius: 5, transform: `scaleX(${strike})`, transformOrigin: "left" }} />}
                    {r.decoy && f < T.without && f >= T.ad && (
                      <div style={{ position: "absolute", right: 140, top: -24, fontFamily: FONT.title, fontWeight: 900, fontSize: 30, color: "#fff", background: RED, border: `4px solid ${COL.ink}`, borderRadius: 10, padding: "0 10px", transform: `rotate(8deg) scale(${pop(f, T.printOnly)})` }}>DECOY</div>
                    )}
                  </div>
                );
              })}
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: "#5a3a3a", textAlign: "center", marginTop: 12 }}>
                {f < T.without ? "Group 1: all three options (100 students)" : "Group 2: print-only removed (100 students)"}
              </div>
            </div>
          )}

          {/* sources + finance line */}
          <div style={{ position: "absolute", left: 540, top: 1585, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: "#ffd9df", whiteSpace: "nowrap", opacity: 0.92 }}>
            Huber, Payne &amp; Puto 1982 · Ariely, Predictably Irrational · popcorn prices illustrative
          </div>
          <div style={{ position: "absolute", left: 540, top: 1630, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 800, fontSize: 28, color: COL.ink, background: "rgba(255,255,255,0.85)", borderRadius: 12, padding: "2px 14px", whiteSpace: "nowrap" }}>
            Education, not financial advice
          </div>
          <VoiceCaptions f={f} y={1480} cues={VOICE_CUES} hi={["large", "medium", "fifty.", "thirty.", "steal.", "decoy.", "decoy,", "smart.", "same", "eighty-four", "percent", "thirty-two.", "torn.", "cross", "two"]} />
        </>
      }
    />
  );
};
