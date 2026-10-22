import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Actor, addPose, idle, type Key, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake, wave, type GestureName } from "../shared/gestures";
import { VOICE_CUES, mouthAt } from "./voice";

// L001 · "The Feed Decides" — one visual world: a neon CONTROL ROOM hidden behind a giant phone.
// Palette: deep navy + cyan glass + hot red (the machine's eye) + a little magenta neon.
// 16:9 layout: safe x 96–1824 / y 54–1026 · title zone y 90–330 · action y 360–880 · ground y 880 ·
// captions y 975. Spark (scale 1.4) lives in the left third; the content sits in the right two thirds.

export const NAVY = "#0b1030";
export const NAVY2 = "#141c4a";
export const CYAN = "#3fe0ff";
export const HOT = "#ff2d55";
export const NEON = "#ff4fd8";
export const GLASS = "rgba(63,224,255,0.10)";
export const GROUND = 880;
export const SS = 1.5; // Spark scale
export const SGY = GROUND - 92.5 * SS;
export const YS = 1.15; // YOU / other figures
export const YGY = GROUND - 92.5 * YS;
export const YOU_COL = COL.orange;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const W = (cue: number, word = 0) => {
  const c = VOICE_CUES[cue];
  return c.words[Math.min(word, c.words.length - 1)].s;
};
export const C = (cue: number) => VOICE_CUES[cue].startFrame;
export const CE = (cue: number) => VOICE_CUES[cue].endFrame;
export const pop = (f: number, at: number) => interpolate(f, [at, at + 6, at + 11], [0, 1.12, 1], clamp);
export const soft = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
// visible between a and b with short fades
export const vis = (f: number, a: number, b: number, fade = 6) =>
  f < a || f > b + fade ? 0 : Math.min(interpolate(f, [a, a + fade], [0, 1], clamp), interpolate(f, [b, b + fade], [1, 0], clamp));
export const K = { stroke: COL.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

// ---------------------------------------------------------------------------------------------------------
// Background: the control room. `tint` 0..1 shifts the wall hue per chapter (a scene change you can see),
// `dim` darkens it (for the "nobody tells you" whisper beat).
// ---------------------------------------------------------------------------------------------------------
export const Room: React.FC<{ f: number; hue?: string; dim?: number; grid?: number }> = ({ f, hue = NAVY2, dim = 0, grid = 1 }) => (
  <AbsoluteFill>
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="l1wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY} />
          <stop offset="100%" stopColor={hue} />
        </linearGradient>
        <linearGradient id="l1floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2560" />
          <stop offset="100%" stopColor="#070a1f" />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#l1wall)" />
      {/* glass wall panels */}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={40 + i * 270} y={70} width={240} height={740} rx={10} fill={GLASS} stroke={CYAN} strokeOpacity={0.18} strokeWidth={3} />
      ))}
      {/* neon strip */}
      <rect x={0} y={44} width={1920} height={6} fill={NEON} opacity={0.55 + 0.15 * Math.sin(f * 0.07)} />
      {/* tiny server LEDs */}
      {Array.from({ length: 40 }, (_, i) => (
        <circle
          key={`l${i}`}
          cx={70 + (i % 20) * 92}
          cy={120 + Math.floor(i / 20) * 640}
          r={4}
          fill={i % 3 === 0 ? HOT : CYAN}
          opacity={0.25 + 0.6 * (Math.sin(f * 0.11 + i * 1.7) > 0.4 ? 1 : 0)}
        />
      ))}
      {/* floor with perspective grid */}
      <rect x={0} y={GROUND} width={1920} height={1080 - GROUND} fill="url(#l1floor)" />
      <g opacity={0.35 * grid}>
        {Array.from({ length: 21 }, (_, i) => (
          <line key={`g${i}`} x1={960 + (i - 10) * 60} y1={GROUND} x2={960 + (i - 10) * 260} y2={1080} stroke={CYAN} strokeWidth={2} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <line key={`h${i}`} x1={0} y1={GROUND + 18 + i * i * 14 + i * 20} x2={1920} y2={GROUND + 18 + i * i * 14 + i * 20} stroke={CYAN} strokeWidth={2} />
        ))}
      </g>
      <line x1={0} y1={GROUND} x2={1920} y2={GROUND} stroke={CYAN} strokeWidth={4} opacity={0.8} />
      {dim > 0 && <rect width={1920} height={1080} fill="#000" opacity={dim} />}
    </svg>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------------------------------------
// A video card (thumbnail). Icons are drawn shapes (no logos).
// ---------------------------------------------------------------------------------------------------------
export type Icon = "play" | "pan" | "car" | "cat" | "ball" | "music" | "bait" | "game";
export const CARD_COLS = ["#ff9f1c", "#2ec4b6", "#e71d36", "#7b2ff7", "#3a86ff", "#ffbe0b", "#8ac926", "#ff006e", "#06d6a0", "#118ab2"];

export const VCard: React.FC<{
  x: number;
  y: number;
  s?: number;
  r?: number;
  color?: string;
  icon?: Icon;
  o?: number;
  glow?: number;
  progress?: number; // red progress bar 0..1
  tag?: string;
  tagCol?: string;
  score?: string;
}> = ({ x, y, s = 1, r = 0, color = CARD_COLS[0], icon = "play", o = 1, glow = 0, progress, tag, tagCol = HOT, score }) =>
  o <= 0.01 || s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      {glow > 0 && <rect x={-118} y={-78} width={236} height={156} rx={24} fill={CYAN} opacity={0.35 * glow} />}
      <rect x={-100} y={-60} width={200} height={120} rx={14} fill={color} {...K} />
      <rect x={-100} y={20} width={200} height={40} rx={0} fill="#000" opacity={0.18} />
      {icon === "play" && (
        <g>
          <circle r={26} fill="#fff" opacity={0.92} />
          <path d="M -8 -13 L 14 0 L -8 13 Z" fill={color} />
        </g>
      )}
      {icon === "pan" && (
        <g transform="translate(-8 -6)">
          <ellipse rx={34} ry={22} fill="#2b2b2b" stroke="#fff" strokeWidth={4} />
          <rect x={30} y={-5} width={46} height={10} rx={5} fill="#2b2b2b" stroke="#fff" strokeWidth={3} />
          <ellipse cx={-4} cy={-2} rx={12} ry={8} fill="#fff" />
          <circle cx={-4} cy={-2} r={5} fill="#ffbe0b" />
        </g>
      )}
      {icon === "car" && (
        <g transform="translate(0 0)">
          <path d="M -46 8 L -40 -10 L -18 -24 L 20 -24 L 38 -8 L 48 -6 L 48 12 L -46 12 Z" fill="#fff" stroke={COL.ink} strokeWidth={3} />
          <circle cx={-24} cy={14} r={10} fill="#2b2b2b" stroke="#fff" strokeWidth={3} />
          <circle cx={28} cy={14} r={10} fill="#2b2b2b" stroke="#fff" strokeWidth={3} />
        </g>
      )}
      {icon === "cat" && (
        <g>
          <circle r={24} fill="#fff" />
          <path d="M -22 -10 L -18 -34 L -4 -22 Z M 22 -10 L 18 -34 L 4 -22 Z" fill="#fff" />
          <circle cx={-8} cy={-2} r={3.5} fill={COL.ink} />
          <circle cx={8} cy={-2} r={3.5} fill={COL.ink} />
        </g>
      )}
      {icon === "ball" && (
        <g>
          <circle r={26} fill="#fff" stroke={COL.ink} strokeWidth={3} />
          <path d="M -26 0 Q 0 -14 26 0 M 0 -26 Q -12 0 0 26" stroke={COL.ink} strokeWidth={3} fill="none" />
        </g>
      )}
      {icon === "music" && <path d="M -10 16 L -10 -22 L 18 -28 L 18 10" stroke="#fff" strokeWidth={6} fill="none" />}
      {icon === "game" && (
        <g>
          <rect x={-36} y={-18} width={72} height={36} rx={16} fill="#fff" />
          <path d="M -22 0 h 14 M -15 -7 v 14" stroke={COL.ink} strokeWidth={4} />
          <circle cx={16} cy={-4} r={4} fill={COL.ink} />
          <circle cx={24} cy={4} r={4} fill={COL.ink} />
        </g>
      )}
      {icon === "bait" && (
        <g>
          <text y={18} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill="#fff" stroke={COL.ink} strokeWidth={3}>
            !!!
          </text>
        </g>
      )}
      {progress !== undefined && (
        <g>
          <rect x={-100} y={54} width={200} height={6} fill="#fff" opacity={0.6} />
          <rect x={-100} y={54} width={200 * progress} height={6} fill={HOT} />
        </g>
      )}
      {tag && (
        <g transform="translate(0 -84)">
          <rect x={-tag.length * 9 - 14} y={-20} width={tag.length * 18 + 28} height={40} rx={20} fill={tagCol} stroke={COL.ink} strokeWidth={3} />
          <text y={11} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill="#fff" letterSpacing={1}>
            {tag}
          </text>
        </g>
      )}
      {score && (
        <g transform="translate(80 -46)">
          <circle r={30} fill="#fff" stroke={COL.ink} strokeWidth={4} />
          <text y={11} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={32} fill={COL.ink}>
            {score}
          </text>
        </g>
      )}
    </g>
  );

// ---------------------------------------------------------------------------------------------------------
// The machine: a glass cabinet with a red eye core. `open` 0..1 for the reveal, `blink` closes the lid.
// Pipe inlets on its left edge: inlet(i) gives the anchor point of signal pipe i (0..7).
// ---------------------------------------------------------------------------------------------------------
export const MACH = { x: 1380, y: 520, w: 560, h: 520 };
export const inlet = (i: number, m = MACH): [number, number] => [m.x - m.w / 2, m.y - m.h / 2 + 50 + i * ((m.h - 100) / 7)];

export const Machine: React.FC<{ f: number; x?: number; y?: number; s?: number; o?: number; look?: number; heat?: number; label?: boolean }> = ({
  f,
  x = MACH.x,
  y = MACH.y,
  s = 1,
  o = 1,
  look = 0,
  heat = 0,
  label = true,
}) => {
  if (o <= 0.01) return null;
  const w = MACH.w;
  const h = MACH.h;
  const ph = (f % 110) / 110;
  const blink = ph > 0.95 ? 1 - Math.abs(ph - 0.975) / 0.025 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <rect x={-w / 2 - 14} y={-h / 2 - 14} width={w + 28} height={h + 28} rx={40} fill={CYAN} opacity={0.12 + 0.08 * Math.sin(f * 0.1)} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={30} fill="#0d1538" stroke={CYAN} strokeWidth={6} />
      {/* rotating rings */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          r={130 + i * 34}
          fill="none"
          stroke={i === 1 ? NEON : CYAN}
          strokeWidth={5}
          strokeDasharray={`${60 + i * 30} ${40 + i * 20}`}
          transform={`rotate(${(i % 2 ? -1 : 1) * f * (1.2 + i * 0.5)})`}
          opacity={0.55}
        />
      ))}
      {/* eye */}
      <ellipse rx={110} ry={70 * (1 - blink * 0.95)} fill="#fff" stroke={COL.ink} strokeWidth={6} />
      {blink < 0.6 && (
        <>
          <circle cx={look * 40} r={44} fill={HOT} />
          <circle cx={look * 40} r={22} fill="#1a0008" />
          <circle cx={look * 40 + 12} cy={-14} r={9} fill="#fff" />
        </>
      )}
      {heat > 0 && <ellipse rx={150} ry={100} fill={HOT} opacity={0.25 * heat} />}
      {/* LEDs */}
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={-w / 2 + 50 + i * ((w - 100) / 7)} cy={h / 2 - 36} r={9} fill={(Math.floor(f / 6) + i) % 4 === 0 ? HOT : CYAN} opacity={0.9} />
      ))}
      {label && (
        <text y={-h / 2 + 52} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={CYAN} letterSpacing={6}>
          THE RECOMMENDER
        </text>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------
// A portrait phone. Children are drawn in phone-local coords (0,0 = screen centre), clipped to the screen.
// ---------------------------------------------------------------------------------------------------------
export const PHONE = { w: 300, h: 560 };
export const Phone: React.FC<{ id: string; x: number; y: number; s?: number; r?: number; o?: number; split?: number; children?: React.ReactNode }> = ({
  id,
  x,
  y,
  s = 1,
  r = 0,
  o = 1,
  split = 0,
  children,
}) => {
  if (o <= 0.01) return null;
  const { w, h } = PHONE;
  const half = (side: -1 | 1) => (
    <g transform={`translate(${side * split * 420} 0) rotate(${side * split * 12})`}>
      <clipPath id={`${id}h${side}`}>
        <rect x={side < 0 ? -w / 2 - 30 : 0} y={-h / 2 - 30} width={w / 2 + 30} height={h + 60} />
      </clipPath>
      <g clipPath={`url(#${id}h${side})`}>
        <rect x={-w / 2 - 18} y={-h / 2 - 30} width={w + 36} height={h + 60} rx={44} fill="#11131c" stroke={COL.ink} strokeWidth={6} />
        <g clipPath={`url(#${id}scr)`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#f5f7ff" />
          {children}
        </g>
        <rect x={-40} y={-h / 2 - 18} width={80} height={10} rx={5} fill="#333" />
      </g>
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <defs>
        <clipPath id={`${id}scr`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} />
        </clipPath>
      </defs>
      {half(-1)}
      {half(1)}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------
// HTML callouts
// ---------------------------------------------------------------------------------------------------------
export const Pill: React.FC<{
  f: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  size?: number;
  bg?: string;
  color?: string;
  r?: number;
  children: React.ReactNode;
  font?: string;
}> = ({ f, at, out = 1e9, x, y, size = 44, bg = "#fff", color = COL.ink, r = 0, children, font = FONT.title }) => {
  const o = vis(f, at, out);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${r}deg) scale(${pop(f, at)})`,
        opacity: o,
        background: bg,
        color,
        border: `5px solid ${COL.ink}`,
        borderRadius: 18,
        padding: "4px 22px",
        fontFamily: font,
        fontWeight: 900,
        fontSize: size,
        whiteSpace: "nowrap",
        letterSpacing: 1,
        lineHeight: 1.15,
        boxShadow: "0 8px 0 rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
};

export const Big: React.FC<{ f: number; at: number; out?: number; x: number; y: number; size?: number; color?: string; r?: number; children: React.ReactNode }> = ({
  f,
  at,
  out = 1e9,
  x,
  y,
  size = 110,
  color = "#fff",
  r = 0,
  children,
}) => {
  const d = f - at;
  if (d < 0 || f > out + 8) return null;
  const s = interpolate(d, [0, 5, 9, 13], [2.6, 0.92, 1.05, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${s}) rotate(${r}deg)`,
        opacity: interpolate(d, [0, 3], [0, 1], clamp) * interpolate(f, [out, out + 8], [1, 0], clamp),
        fontFamily: FONT.comic,
        fontSize: size,
        color,
        WebkitTextStroke: `${Math.round(size / 13)}px ${COL.ink}`,
        paintOrder: "stroke fill",
        whiteSpace: "nowrap",
        letterSpacing: 3,
        lineHeight: 1,
        textShadow: "0 8px 0 rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
};

// Source line (top right) while a number or claim is on screen
export const Src: React.FC<{ f: number; at: number; out: number; children: React.ReactNode }> = ({ f, at, out, children }) => {
  const o = vis(f, at, out, 8);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 110,
        top: 66,
        opacity: o * 0.92,
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 24,
        color: "#cfe9ff",
        background: "rgba(0,0,0,0.35)",
        borderRadius: 10,
        padding: "3px 14px",
        whiteSpace: "nowrap",
      }}
    >
      Source: {children}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------
// Spark acting: one row per spoken beat → gesture (with anticipation/holds), mood, optional layer.
// Rule: never the same gesture twice in a row (throws, so a still render catches it).
// ---------------------------------------------------------------------------------------------------------
export type Layer = "nod" | "hop" | "wave" | "shake";
export type Act = [frame: number, gesture: GestureName, mood: Mood, layer?: Layer, snap?: boolean];

export const useActing = (rows: Act[]) => {
  rows.forEach((r, i) => {
    if (i > 0 && rows[i - 1][1] === r[1]) throw new Error(`Spark repeats gesture ${r[1]} at ${r[0]}`);
  });
  const keys: Key[] = gestureKeys(rows.map(([fr, g, , , snap]) => [fr, G[g], snap === false ? "smooth" : "snap"]));
  const mood = (t: number): Mood => {
    let m: Mood = rows[0][2];
    for (const r of rows) if (t >= r[0] - 2) m = r[2];
    return m;
  };
  const mod = (t: number, p: Pose): Pose => {
    let q = addPose(p, idle(t, 8));
    for (const [fr, , , layer] of rows) {
      if (!layer) continue;
      const d = layer === "nod" ? nod(t, fr + 2) : layer === "hop" ? hop(t, fr, 36) : layer === "wave" ? wave(t, fr + 4, 36) : shake(t, fr + 2);
      q = addPose(q, d);
    }
    return q;
  };
  return { keys, mood, mod };
};

export const SparkHost: React.FC<{ f: number; rows: Act[]; x?: number; bulbs?: number[]; look?: number; facing?: number; y?: number; s?: number }> = ({
  f,
  rows,
  x = 300,
  bulbs = [],
  look = 1,
  facing = 1,
  y,
  s = SS,
}) => {
  const { keys, mood, mod } = useActing(rows);
  const bulb = (t: number) => bulbs.reduce((m, b) => Math.max(m, bulbPulse(t, b, 40)), 0);
  return (
    <Spark f={f} scale={s} base={{ x, y: y ?? GROUND - 92.5 * s }} keys={keys} mood={mood} mod={mod} talk={(t) => mouthAt(t)} bulb={bulb} look={look} facing={facing} />
  );
};

// YOU: plain engine figure, orange, labelled
export const You: React.FC<{
  f: number;
  x: number;
  keys: Key[];
  facing?: number;
  o?: number;
  s?: number;
  y?: number;
  face?: "none" | "eyes" | "angry" | "sad" | "happy";
  label?: string;
  color?: string;
  children?: (j: import("../stickman/stick").Joints) => React.ReactNode;
}> = ({ f, x, keys, facing = -1, o = 1, s = YS, y, face = "eyes", label = "YOU", color = YOU_COL, children }) =>
  o <= 0.01 ? null : (
    <Actor
      f={f}
      color={color}
      scale={s}
      label={label}
      face={face}
      base={{ x, y: y ?? GROUND - 92.5 * s }}
      keys={keys}
      facing={facing}
      opacity={o}
      mod={(t, p) => addPose(p, idle(t, 3))}
    >
      {children}
    </Actor>
  );
