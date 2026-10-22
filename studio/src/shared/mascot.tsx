import React from "react";
import { interpolate } from "remotion";
import { Actor, type Joints, type Key, type Pose } from "../stickman/stick";
import { COL } from "../stickman/fx";

// ---------------------------------------------------------------------------
// SPARK — the channel's recurring host. Use him in EVERY video (narrator/explainer),
// always with these signature features so the account stays recognisable:
//   · electric-teal body (SPARK_COLOR), never used for any other character
//   · big round white glasses with pupils (frontal, expressive eyes)
//   · a lightbulb antenna that glows on the "aha" beat (bulb prop 0..1)
//   · yellow sneakers
//   · a talking mouth driven by the voiceover (talk prop 0..1, from voice.ts)
// Other characters (YOU = orange, AI = blue, etc.) keep the plain engine look.
// ---------------------------------------------------------------------------

export const SPARK_COLOR = "#0fb5a6";
export const SPARK_DARK = "#0a7f75";
export const BULB_ON = "#ffd23f";

// Expressions. The first six are the originals; the rest were added 2026-10-22 (owner asked for more
// gestures and expressions). Spark's look (teal, glasses, bulb, sneakers) is unchanged.
export type Mood =
  | "neutral" | "happy" | "shock" | "sad" | "smug" | "angry"
  | "curious" // one brow up, eyes up, small "o"
  | "excited" // big grin, big pupils with sparkles, blush
  | "worried" // brows up in the middle, wobbly mouth, sweat drop
  | "wink" // right eye closed, smirk
  | "laugh" // eyes ^ ^, open laugh, blush
  | "thinking" // eyes up-left, mouth pulled to the side
  | "skeptical" // one brow down, flat side mouth
  | "mindblown" // huge eyes, open mouth, burst lines around the head
  | "determined"; // brows down + small confident smile

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Head: React.FC<{
  j: Joints;
  s: number;
  f: number;
  talk: number;
  bulb: number;
  mood: Mood;
  look: number;
  blinkSeed: number;
}> = ({ j, s, f, talk, bulb, mood, look, blinkSeed }) => {
  const [hx, hy] = j.headC;
  const R = j.headR;
  const ux = (hx - j.neck[0]) / (R + 3);
  const uy = (hy - j.neck[1]) / (R + 3);
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI + 90;
  // natural blinks every ~3-4 s (deterministic)
  const cycle = 96 + (blinkSeed % 3) * 14;
  const ph = (f + blinkSeed * 37) % cycle;
  const blink = ph < 4 ? 1 - Math.abs(ph - 2) / 2 : 0;
  const big = mood === "shock" || mood === "mindblown" || mood === "excited";
  const eyeH = (big ? 6.2 : 4.6) * (1 - blink * 0.9);
  const px = look * 2.4 + (mood === "thinking" ? -2.4 : 0);
  const py = mood === "curious" || mood === "thinking" ? -2.2 : 0;
  const closedEye = (cx: number) => (mood === "laugh" ? true : mood === "wink" && cx > 0);
  const o = Math.max(0, Math.min(1, talk));
  // mouth: closed smile/line when silent, open ellipse while speaking
  const mouthY = 11 * s;
  const glow = Math.max(0, Math.min(1, bulb));
  const stemTop = -R - 22 * s;
  return (
    <g transform={`translate(${hx} ${hy}) rotate(${ang})`}>
      {/* antenna + bulb */}
      <path d={`M0,${-R + 2 * s} Q${4 * s},${-R - 10 * s} 0,${stemTop + 4 * s}`} stroke={SPARK_DARK} strokeWidth={4 * s} fill="none" strokeLinecap="round" />
      {glow > 0.05 && (
        <>
          <circle cx={0} cy={stemTop - 6 * s} r={(18 + glow * 10) * s} fill={BULB_ON} opacity={0.22 * glow} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + f * 0.02;
            const r1 = 15 * s;
            const r2 = (15 + 10 * glow) * s;
            return (
              <line
                key={i}
                x1={Math.cos(a) * r1}
                y1={stemTop - 6 * s + Math.sin(a) * r1}
                x2={Math.cos(a) * r2}
                y2={stemTop - 6 * s + Math.sin(a) * r2}
                stroke={BULB_ON}
                strokeWidth={3 * s}
                strokeLinecap="round"
                opacity={glow}
              />
            );
          })}
        </>
      )}
      <circle cx={0} cy={stemTop - 6 * s} r={8 * s} fill={glow > 0.05 ? BULB_ON : "#fff7d6"} stroke={COL.ink} strokeWidth={2.5 * s} />
      <rect x={-4 * s} y={stemTop + 1 * s} width={8 * s} height={5 * s} rx={1.5 * s} fill="#8a8a8a" stroke={COL.ink} strokeWidth={1.5 * s} />
      {/* glasses: two big white lenses with dark rims + bridge */}
      <line x1={-3 * s} y1={-3 * s} x2={3 * s} y2={-3 * s} stroke={COL.ink} strokeWidth={2.5 * s} />
      {[-9.5, 9.5].map((cx) => (
        <g key={cx}>
          <circle cx={cx * s} cy={-3 * s} r={8 * s} fill="#ffffff" stroke={COL.ink} strokeWidth={2.6 * s} />
          {closedEye(cx) ? (
            <path d={`M${(cx - 5) * s},${-1.5 * s} Q${cx * s},${-7 * s} ${(cx + 5) * s},${-1.5 * s}`} stroke={COL.ink} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx={(cx + px) * s} cy={(-2.5 + py) * s} rx={(big ? 3.3 : 2.8) * s} ry={eyeH * 0.62 * s} fill={COL.ink} />
              {mood === "excited" && <circle cx={(cx + px + 1.2) * s} cy={(-4 + py) * s} r={1.1 * s} fill="#fff" />}
              {blink > 0.5 && <line x1={(cx - 6) * s} y1={-3 * s} x2={(cx + 6) * s} y2={-3 * s} stroke={COL.ink} strokeWidth={2.4 * s} />}
            </>
          )}
        </g>
      ))}
      {/* brows for mood */}
      {mood === "angry" && (
        <path d={`M${-16 * s},${-15 * s} L${-4 * s},${-11 * s} M${16 * s},${-15 * s} L${4 * s},${-11 * s}`} stroke={COL.ink} strokeWidth={2.6 * s} strokeLinecap="round" />
      )}
      {mood === "sad" && (
        <path d={`M${-15 * s},${-11 * s} L${-5 * s},${-15 * s} M${15 * s},${-11 * s} L${5 * s},${-15 * s}`} stroke={COL.ink} strokeWidth={2.6 * s} strokeLinecap="round" />
      )}
      {mood === "shock" && (
        <path d={`M${-15 * s},${-17 * s} Q${-9.5 * s},${-21 * s} ${-4 * s},${-17 * s} M${4 * s},${-17 * s} Q${9.5 * s},${-21 * s} ${15 * s},${-17 * s}`} stroke={COL.ink} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
      )}
      {mood === "smug" && (
        <path d={`M${-15 * s},${-14 * s} L${-4 * s},${-15 * s} M${4 * s},${-17 * s} L${15 * s},${-14 * s}`} stroke={COL.ink} strokeWidth={2.4 * s} strokeLinecap="round" />
      )}
      {mood === "curious" && (
        <path d={`M${-15 * s},${-14 * s} L${-4 * s},${-14 * s} M${4 * s},${-18 * s} Q${9.5 * s},${-22 * s} ${15 * s},${-17 * s}`} stroke={COL.ink} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
      )}
      {(mood === "excited" || mood === "laugh") && (
        <path d={`M${-15 * s},${-17 * s} Q${-9.5 * s},${-20 * s} ${-4 * s},${-17 * s} M${4 * s},${-17 * s} Q${9.5 * s},${-20 * s} ${15 * s},${-17 * s}`} stroke={COL.ink} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
      )}
      {mood === "worried" && (
        <path d={`M${-15 * s},${-12 * s} L${-5 * s},${-17 * s} M${15 * s},${-12 * s} L${5 * s},${-17 * s}`} stroke={COL.ink} strokeWidth={2.6 * s} strokeLinecap="round" />
      )}
      {mood === "thinking" && (
        <path d={`M${-15 * s},${-17 * s} L${-4 * s},${-15 * s} M${4 * s},${-15 * s} L${15 * s},${-15 * s}`} stroke={COL.ink} strokeWidth={2.4 * s} strokeLinecap="round" />
      )}
      {mood === "skeptical" && (
        <path d={`M${-15 * s},${-18 * s} Q${-9.5 * s},${-21 * s} ${-4 * s},${-17 * s} M${4 * s},${-13 * s} L${15 * s},${-15 * s}`} stroke={COL.ink} strokeWidth={2.6 * s} fill="none" strokeLinecap="round" />
      )}
      {(mood === "determined" || mood === "wink") && (
        <path d={`M${-16 * s},${-15 * s} L${-4 * s},${-12.5 * s} M${16 * s},${-15 * s} L${4 * s},${-12.5 * s}`} stroke={COL.ink} strokeWidth={2.6 * s} strokeLinecap="round" />
      )}
      {mood === "mindblown" && (
        <path d={`M${-15 * s},${-19 * s} Q${-9.5 * s},${-24 * s} ${-4 * s},${-19 * s} M${4 * s},${-19 * s} Q${9.5 * s},${-24 * s} ${15 * s},${-19 * s}`} stroke={COL.ink} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
      )}
      {/* cheeks / sweat / burst */}
      {(mood === "happy" || mood === "excited" || mood === "laugh" || mood === "wink") && (
        <>
          <ellipse cx={-15 * s} cy={7 * s} rx={3.6 * s} ry={2.2 * s} fill="#ff8fa3" opacity={0.75} />
          <ellipse cx={15 * s} cy={7 * s} rx={3.6 * s} ry={2.2 * s} fill="#ff8fa3" opacity={0.75} />
        </>
      )}
      {mood === "worried" && (
        <path d={`M${19 * s},${-12 * s} q ${3 * s} ${5 * s} 0 ${7 * s} q ${-3 * s} ${-2 * s} 0 ${-7 * s} Z`} fill="#8fd3ff" stroke={COL.ink} strokeWidth={1.4 * s} transform={`translate(0 ${(f % 30) * 0.12 * s})`} />
      )}
      {mood === "mindblown" &&
        Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2 + 0.3;
          const r1 = R + 6 * s + Math.sin(f * 0.5 + i) * 2 * s;
          const r2 = r1 + 9 * s;
          return <line key={`mb${i}`} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke={BULB_ON} strokeWidth={2.6 * s} strokeLinecap="round" />;
        })}
      {/* mouth */}
      {o > 0.06 ? (
        <g>
          <ellipse cx={0} cy={mouthY + o * 2 * s} rx={(5 + 3.5 * o + (Math.floor(f / 3) % 2) * 1.2 * o) * s} ry={(1.6 + 6.8 * o) * s} fill="#3b1d1d" stroke={COL.ink} strokeWidth={1.8 * s} />
          {o > 0.45 && <ellipse cx={0} cy={mouthY + (o * 2 + 3.6 * o) * s} rx={3.2 * o * s} ry={1.8 * o * s} fill="#e86a6a" />}
        </g>
      ) : mood === "shock" ? (
        <ellipse cx={0} cy={mouthY + 1 * s} rx={4 * s} ry={5 * s} fill="#3b1d1d" stroke={COL.ink} strokeWidth={1.8 * s} />
      ) : mood === "sad" ? (
        <path d={`M${-6 * s},${mouthY + 4 * s} Q0,${mouthY - 2 * s} ${6 * s},${mouthY + 4 * s}`} stroke={COL.ink} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
      ) : mood === "angry" ? (
        <line x1={-6 * s} y1={mouthY + 1 * s} x2={6 * s} y2={mouthY + 1 * s} stroke={COL.ink} strokeWidth={2.4 * s} strokeLinecap="round" />
      ) : mood === "mindblown" ? (
        <ellipse cx={0} cy={mouthY + 2 * s} rx={5.5 * s} ry={6.5 * s} fill="#3b1d1d" stroke={COL.ink} strokeWidth={1.8 * s} />
      ) : mood === "curious" ? (
        <circle cx={1 * s} cy={mouthY + 1 * s} r={2.6 * s} fill="#3b1d1d" stroke={COL.ink} strokeWidth={1.6 * s} />
      ) : mood === "laugh" || mood === "excited" ? (
        <g>
          <path d={`M${-8 * s},${mouthY - 2 * s} Q0,${mouthY + 11 * s} ${8 * s},${mouthY - 2 * s} Z`} fill="#3b1d1d" stroke={COL.ink} strokeWidth={2 * s} strokeLinejoin="round" />
          <ellipse cx={0} cy={mouthY + 4.5 * s} rx={3.4 * s} ry={1.8 * s} fill="#e86a6a" />
        </g>
      ) : mood === "worried" ? (
        <path d={`M${-6 * s},${mouthY + 2 * s} q ${3 * s} ${-3 * s} ${6 * s} 0 q ${3 * s} ${3 * s} ${6 * s} 0`} stroke={COL.ink} strokeWidth={2.2 * s} fill="none" strokeLinecap="round" transform={`translate(${-3 * s} 0)`} />
      ) : mood === "thinking" || mood === "skeptical" ? (
        <path d={`M${-2 * s},${mouthY + 1 * s} L${7 * s},${mouthY - (mood === "thinking" ? 1.5 : 0) * s}`} stroke={COL.ink} strokeWidth={2.4 * s} strokeLinecap="round" />
      ) : mood === "wink" || mood === "determined" ? (
        <path d={`M${-6 * s},${mouthY} Q${2 * s},${mouthY + 5 * s} ${7 * s},${mouthY - 2.5 * s}`} stroke={COL.ink} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
      ) : (
        <path
          d={`M${-7 * s},${mouthY - 1 * s} Q0,${mouthY + (mood === "happy" || mood === "smug" ? 7 : 4) * s} ${7 * s},${mouthY - 1 * s}`}
          stroke={COL.ink}
          strokeWidth={2.4 * s}
          fill={mood === "happy" ? "#3b1d1d" : "none"}
          strokeLinecap="round"
        />
      )}
    </g>
  );
};

const Sneaker: React.FC<{ at: [number, number]; knee: [number, number]; s: number }> = ({ at, knee, s }) => {
  const dir = at[0] >= knee[0] ? 1 : -1;
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <path
        d={`M${-8 * s * dir},${-6 * s} Q${-9 * s * dir},${5 * s} ${-2 * s * dir},${6 * s} L${16 * s * dir},${6 * s} Q${19 * s * dir},${0} ${10 * s * dir},${-4 * s} Z`}
        fill={BULB_ON}
        stroke={COL.ink}
        strokeWidth={2.6 * s}
        strokeLinejoin="round"
      />
      <line x1={-3 * s * dir} y1={4 * s} x2={14 * s * dir} y2={4 * s} stroke="#ffffff" strokeWidth={2 * s} />
    </g>
  );
};

/**
 * Spark, the recurring host. Same API as Actor plus:
 *  talk  (frame) => 0..1 mouth openness — pass `(t) => mouthAt(from + t)` from voice.ts
 *  bulb  (frame) => 0..1 antenna glow   — light it on the "aha"/reveal beats
 *  mood  (frame) => Mood
 *  look  -1..1 pupils left/right
 */
export const Spark: React.FC<{
  f: number;
  keys: Key[];
  base?: Partial<Pose>;
  scale?: number;
  facing?: number | ((f: number) => number);
  mod?: (f: number, p: Pose) => Pose;
  talk?: (f: number) => number;
  bulb?: (f: number) => number;
  mood?: (f: number) => Mood;
  look?: number;
  label?: boolean;
  draw?: number;
  trails?: boolean;
  children?: (j: Joints) => React.ReactNode;
}> = ({ f, keys, base, scale = 1.6, facing = 1, mod, talk, bulb, mood, look = 0, label = false, draw, trails, children }) => {
  const drawn = draw === undefined || draw >= 1;
  return (
    <Actor
      f={f}
      keys={keys}
      base={base}
      scale={scale}
      facing={facing}
      color={SPARK_COLOR}
      face="none"
      label={label ? "SPARK" : undefined}
      mod={mod}
      draw={draw}
      trails={trails}
    >
      {(j) => (
        <>
          {drawn && (
            <>
              <Sneaker at={j.lFoot} knee={j.lKnee} s={scale} />
              <Sneaker at={j.rFoot} knee={j.rKnee} s={scale} />
              <Head
                j={j}
                s={scale}
                f={f}
                talk={talk ? talk(f) : 0}
                bulb={bulb ? bulb(f) : 0}
                mood={mood ? mood(f) : "neutral"}
                look={look}
                blinkSeed={3}
              />
            </>
          )}
          {children?.(j)}
        </>
      )}
    </Actor>
  );
};

// helper: bulb that pops on at `at`, holds for `hold` frames and fades
export const bulbPulse = (f: number, at: number, hold = 30) =>
  interpolate(f, [at, at + 4, at + hold, at + hold + 10], [0, 1, 1, 0], clamp);
