import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { addPose, idle, walkCycle, type Key, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake, wave, type GestureName } from "../shared/gestures";
import { camAt, drift, sparkAt, Transition, type Place, type Shot, type TransitionKind } from "../shared/camera";
import { VOICE_CUES, mouthAt } from "./voice";

// L002 · "ChatGPT Doesn't Know What It's Going to Say Next" — one visual world: a WORD WORKSHOP on cream paper.
// A giant typewriter fed by a probability slot machine, token bricks on a conveyor, bar charts made of light.
// Palette: cream paper + electric purple + mint (+ coral for "wrong", gold for the pick).
// 16:9 layout: safe x 96–1824 / y 54–1026 · title y 90–330 · action y 360–880 · ground y 880 · captions y 975.

export const CREAM = "#f6efe0";
export const CREAM2 = "#ece0c6";
export const PURPLE = "#7b2ff7";
export const PURPLE_D = "#3d1585";
export const NIGHT = "#1c0b3f";
export const MINT = "#3ee6b0";
export const MINT_D = "#14a37a";
export const CORAL = "#ff5a4e";
export const GOLD = "#ffc83d";
export const INK = COL.ink;
export const GROUND = 880;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const W = (cue: number, word = 0) => {
  const c = VOICE_CUES[cue];
  return c.words[Math.min(word, c.words.length - 1)].s;
};
export const C = (cue: number) => VOICE_CUES[cue].startFrame;
export const CE = (cue: number) => VOICE_CUES[cue].endFrame;
export const pop = (f: number, at: number) => interpolate(f, [at, at + 6, at + 11], [0, 1.12, 1], clamp);
export const soft = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
export const vis = (f: number, a: number, b: number, fade = 6) =>
  f < a || f > b + fade ? 0 : Math.min(interpolate(f, [a, a + fade], [0, 1], clamp), interpolate(f, [b, b + fade], [1, 0], clamp));
export const K = { stroke: INK, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
export const TXT = { fontFamily: FONT.title, fontWeight: 900 } as const;

// ---------------------------------------------------------------------------------------------------------
// Backgrounds (one per chapter so the staging visibly changes): ruled paper, mint grid, night workshop, blueprint.
// ---------------------------------------------------------------------------------------------------------
export type BgKind = "paper" | "grid" | "night" | "blue" | "lilac";
export const Bg: React.FC<{ f: number; kind: BgKind }> = ({ f, kind }) => {
  const dark = kind === "night" || kind === "blue";
  const top = { paper: CREAM, grid: "#eafaf3", night: NIGHT, blue: "#123a6b", lilac: "#efe6ff" }[kind];
  const bot = { paper: CREAM2, grid: "#cdeee0", night: "#0c0420", blue: "#0b2448", lilac: "#d9c8ff" }[kind];
  const line = dark ? "rgba(255,255,255,0.07)" : kind === "grid" ? "rgba(20,163,122,0.18)" : "rgba(123,47,247,0.10)";
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id={`l2bg-${kind}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={top} />
            <stop offset="100%" stopColor={bot} />
          </linearGradient>
          <radialGradient id={`l2glow-${kind}`} cx="0.5" cy="0.45" r="0.6">
            <stop offset="0%" stopColor={dark ? PURPLE : "#ffffff"} stopOpacity={dark ? 0.45 : 0.6} />
            <stop offset="100%" stopColor={top} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={1920} height={1080} fill={`url(#l2bg-${kind})`} />
        <rect width={1920} height={1080} fill={`url(#l2glow-${kind})`} />
        {kind === "paper" || kind === "lilac"
          ? Array.from({ length: 16 }, (_, i) => <line key={i} x1={0} x2={1920} y1={70 + i * 62} y2={70 + i * 62} stroke={line} strokeWidth={3} />)
          : Array.from({ length: 33 }, (_, i) => <line key={i} x1={i * 60 - ((f * 0.4) % 60)} x2={i * 60 - ((f * 0.4) % 60)} y1={0} y2={1080} stroke={line} strokeWidth={2} />)}
        {kind !== "paper" && kind !== "lilac" && Array.from({ length: 19 }, (_, i) => <line key={`h${i}`} x1={0} x2={1920} y1={i * 60} y2={i * 60} stroke={line} strokeWidth={2} />)}
        {kind === "paper" && <line x1={150} x2={150} y1={0} y2={1080} stroke={CORAL} strokeOpacity={0.35} strokeWidth={4} />}
        {/* floating letters drifting upward: the "text in the air" of the workshop */}
        {Array.from({ length: 14 }, (_, i) => {
          const y = 1080 - ((f * (0.6 + (i % 4) * 0.25) + i * 211) % 1250);
          const x = (i * 263 + 90) % 1880;
          return (
            <text key={`l${i}`} x={x} y={y} fontFamily={FONT.title} fontWeight={800} fontSize={34 + (i % 3) * 14} fill={dark ? "#ffffff" : PURPLE} opacity={dark ? 0.08 : 0.07}>
              {"aetonsrhild"[i % 11]}
            </text>
          );
        })}
        {/* floor */}
        <rect x={0} y={GROUND} width={1920} height={200} fill={dark ? "#0a0318" : "#e3d4b4"} opacity={dark ? 0.8 : 0.9} />
        <line x1={0} x2={1920} y1={GROUND} y2={GROUND} stroke={dark ? PURPLE : INK} strokeWidth={5} opacity={dark ? 0.8 : 1} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------
// token brick (a chunk of text)
export const Brick: React.FC<{ x: number; y: number; text: string; color?: string; s?: number; o?: number; r?: number; w?: number; glow?: number; fs?: number }> = ({
  x,
  y,
  text,
  color = PURPLE,
  s = 1,
  o = 1,
  r = 0,
  w,
  glow = 0,
  fs = 46,
}) => {
  if (o <= 0.01 || s <= 0.01) return null;
  const bw = w ?? Math.max(90, text.length * fs * 0.52 + 44);
  const light = color === GOLD || color === MINT || color === "#ffffff" || color === CREAM;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      {glow > 0 && <rect x={-bw / 2 - 14} y={-46} width={bw + 28} height={92} rx={22} fill={GOLD} opacity={0.45 * glow} />}
      <rect x={-bw / 2} y={-34} width={bw} height={68} rx={14} fill={color} {...K} />
      <rect x={-bw / 2 + 8} y={-28} width={bw - 16} height={10} rx={5} fill="#ffffff" opacity={0.25} />
      <text x={0} y={16} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={fs} fill={light ? INK : "#ffffff"}>
        {text}
      </text>
    </g>
  );
};

// speech bubble with a line of text (optional blank slot)
export const Bubble: React.FC<{ x: number; y: number; w: number; h?: number; s?: number; o?: number; tail?: number; children?: React.ReactNode; fill?: string }> = ({
  x,
  y,
  w,
  h = 170,
  s = 1,
  o = 1,
  tail = -1,
  children,
  fill = "#ffffff",
}) => {
  if (o <= 0.01 || s <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <path d={`M ${tail * w * 0.3 - 30} ${h / 2 - 4} L ${tail * w * 0.42} ${h / 2 + 70} L ${tail * w * 0.3 + 40} ${h / 2 - 4} Z`} fill={fill} {...K} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={44} fill={fill} {...K} />
      <rect x={tail * w * 0.3 - 27} y={h / 2 - 10} width={64} height={10} fill={fill} />
      {children}
    </g>
  );
};

// bar chart of next-token options. p = 0..1 grow, pick = index highlighted (gold), heat flattens the bars (temperature)
export type Opt = { t: string; p: number };
export const Bars: React.FC<{ x: number; y: number; opts: Opt[]; grow: number; pick?: number; pickK?: number; flat?: number; s?: number; o?: number; dark?: boolean; showPct?: boolean }> = ({
  x,
  y,
  opts,
  grow,
  pick = -1,
  pickK = 0,
  flat = 0,
  s = 1,
  o = 1,
  dark = false,
  showPct = true,
}) => {
  if (o <= 0.01) return null;
  const n = opts.length;
  const bw = 120;
  const gap = 36;
  const total = n * bw + (n - 1) * gap;
  const maxH = 300;
  const ps = opts.map((q) => q.p);
  const mean = ps.reduce((a, b) => a + b, 0) / n;
  const adj = ps.map((p) => p + (mean - p) * flat);
  const mx = Math.max(...ps);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <line x1={-total / 2 - 30} x2={total / 2 + 30} y1={0} y2={0} stroke={dark ? "#ffffff" : INK} strokeWidth={5} strokeLinecap="round" />
      {opts.map((q, i) => {
        const k = interpolate(grow, [i * 0.12, i * 0.12 + 0.5], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
        const h = Math.max(6, (adj[i] / mx) * maxH * k);
        const bx = -total / 2 + i * (bw + gap);
        const picked = i === pick && pickK > 0;
        return (
          <g key={i}>
            {picked && <rect x={bx - 12} y={-h - 12} width={bw + 24} height={h + 12} rx={16} fill={GOLD} opacity={0.5 * pickK} />}
            <rect x={bx} y={-h} width={bw} height={h} rx={12} fill={picked ? GOLD : i % 2 ? MINT : PURPLE} stroke={INK} strokeWidth={5} />
            <rect x={bx + 10} y={-h + 8} width={18} height={Math.max(0, h - 16)} rx={9} fill="#fff" opacity={0.3} />
            {showPct && k > 0.6 && (
              <text x={bx + bw / 2} y={-h - 16} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={38} fill={dark ? "#ffffff" : INK} opacity={interpolate(k, [0.6, 1], [0, 1], clamp)}>
                {Math.round(adj[i] * 100)}%
              </text>
            )}
            <text x={bx + bw / 2} y={54} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={44} fill={dark ? "#ffffff" : INK}>
              {q.t}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// a paper document (research paper / report) with a title, a year and an optional highlighted quote
export const Doc: React.FC<{ x: number; y: number; title: string[]; year: string; quote?: string[]; hl?: number; s?: number; o?: number; r?: number; w?: number }> = ({
  x,
  y,
  title,
  year,
  quote = [],
  hl = 0,
  s = 1,
  o = 1,
  r = 0,
  w = 560,
}) => {
  if (o <= 0.01 || s <= 0.01) return null;
  const h = 640;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w} height={h} rx={10} fill="#000" opacity={0.18} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="#ffffff" {...K} />
      <path d={`M ${w / 2 - 70} ${-h / 2} L ${w / 2} ${-h / 2 + 70} L ${w / 2 - 70} ${-h / 2 + 70} Z`} fill={CREAM2} {...K} />
      {title.map((t, i) => (
        <text key={i} x={0} y={-h / 2 + 90 + i * 52} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={48} fill={INK}>
          {t}
        </text>
      ))}
      <text x={0} y={-h / 2 + 100 + title.length * 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={26} fill={PURPLE}>
        {year}
      </text>
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={-w / 2 + 50} y={-h / 2 + 170 + title.length * 52 + i * 34} width={w - 100 - ((i * 53) % 90)} height={12} rx={6} fill="#d8d2c4" />
      ))}
      {quote.map((q, i) => {
        const qy = h / 2 - 40 - (quote.length - i) * 56 + 20;
        const k = interpolate(hl, [i * 0.3, i * 0.3 + 0.5], [0, 1], clamp);
        return (
          <g key={`q${i}`}>
            <rect x={-w / 2 + 34} y={qy - 38} width={(w - 68) * k} height={50} rx={8} fill={GOLD} opacity={0.75} />
            <text x={0} y={qy} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={30} fill={INK}>
              {q}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// a big red X stamp (myth busted)
export const XStamp: React.FC<{ x: number; y: number; f: number; at: number; s?: number; label?: string }> = ({ x, y, f, at, s = 1, label }) => {
  const d = f - at;
  if (d < 0) return null;
  const k = interpolate(d, [0, 4, 8], [2.4, 0.9, 1], clamp);
  return (
    <g transform={`translate(${x} ${y}) scale(${k * s}) rotate(-10)`} opacity={interpolate(d, [0, 2], [0, 1], clamp)}>
      <path d="M -120 -120 L 120 120 M 120 -120 L -120 120" stroke={CORAL} strokeWidth={34} strokeLinecap="round" />
      {label && (
        <g>
          <rect x={-140} y={130} width={280} height={74} rx={10} fill="none" stroke={CORAL} strokeWidth={10} />
          <text x={0} y={186} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill={CORAL} letterSpacing={6}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
};

// tick mark (mint)
export const Tick: React.FC<{ x: number; y: number; f: number; at: number; s?: number; color?: string }> = ({ x, y, f, at, s = 1, color = MINT_D }) => {
  const d = f - at;
  if (d < 0) return null;
  const len = interpolate(d, [0, 8], [0, 1], clamp);
  return (
    <path
      d={`M ${x - 60 * s} ${y} L ${x - 15 * s} ${y + 45 * s} L ${x + 70 * s} ${y - 55 * s}`}
      fill="none"
      stroke={color}
      strokeWidth={26 * s}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - len}
    />
  );
};

// svg label on a rounded pill
export const Pill: React.FC<{ x: number; y: number; text: string; s?: number; o?: number; fill?: string; color?: string; fs?: number }> = ({
  x,
  y,
  text,
  s = 1,
  o = 1,
  fill = INK,
  color = "#ffffff",
  fs = 38,
}) => {
  if (o <= 0.01 || s <= 0.01) return null;
  const w = text.length * fs * 0.56 + 50;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <rect x={-w / 2} y={-fs * 0.85} width={w} height={fs * 1.6} rx={fs * 0.8} fill={fill} stroke={INK} strokeWidth={4} />
      <text x={0} y={fs * 0.32} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={fs} fill={color} letterSpacing={1.5}>
        {text}
      </text>
    </g>
  );
};

// plain svg text
export const T: React.FC<{ x: number; y: number; children: React.ReactNode; fs?: number; fill?: string; o?: number; s?: number; anchor?: "middle" | "start" | "end"; font?: string; weight?: number; stroke?: boolean }> = ({
  x,
  y,
  children,
  fs = 60,
  fill = INK,
  o = 1,
  s = 1,
  anchor = "middle",
  font = FONT.title,
  weight = 900,
  stroke = false,
}) =>
  o <= 0.01 || s <= 0.01 ? null : (
    <text
      x={0}
      y={0}
      transform={`translate(${x} ${y}) scale(${s})`}
      textAnchor={anchor}
      fontFamily={font}
      fontWeight={weight}
      fontSize={fs}
      fill={fill}
      opacity={o}
      stroke={stroke ? INK : undefined}
      strokeWidth={stroke ? fs / 9 : undefined}
      paintOrder="stroke fill"
    >
      {children}
    </text>
  );

// arrow
export const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; k?: number; color?: string; w?: number }> = ({ x1, y1, x2, y2, k = 1, color = PURPLE, w = 12 }) => {
  if (k <= 0) return null;
  const ex = x1 + (x2 - x1) * k;
  const ey = y1 + (y2 - y1) * k;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 34;
  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={w} strokeLinecap="round" />
      {k > 0.9 && (
        <path
          d={`M ${ex + Math.cos(a) * 8} ${ey + Math.sin(a) * 8} L ${ex - Math.cos(a - 0.5) * h} ${ey - Math.sin(a - 0.5) * h} L ${ex - Math.cos(a + 0.5) * h} ${ey - Math.sin(a + 0.5) * h} Z`}
          fill={color}
          stroke={INK}
          strokeWidth={4}
        />
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------
// Screen-space overlays (html): big slam words, a source line, a disclaimer
// ---------------------------------------------------------------------------------------------------------
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
        WebkitTextStroke: `${Math.round(size / 12)}px ${INK}`,
        paintOrder: "stroke fill",
        whiteSpace: "nowrap",
        letterSpacing: 3,
        lineHeight: 1,
        textShadow: "0 8px 0 rgba(0,0,0,0.3)",
      }}
    >
      {children}
    </div>
  );
};

export const Src: React.FC<{ f: number; at: number; out: number; children: React.ReactNode }> = ({ f, at, out, children }) => {
  const o = vis(f, at, out, 8);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 110,
        top: 64,
        opacity: o * 0.94,
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 24,
        color: "#ffffff",
        background: "rgba(40,16,90,0.78)",
        borderRadius: 10,
        padding: "4px 14px",
        whiteSpace: "nowrap",
      }}
    >
      Source: {children}
    </div>
  );
};

export const Note: React.FC<{ f: number; at: number; out: number; children: React.ReactNode; left?: number; top?: number }> = ({ f, at, out, children, left = 110, top = 64 }) => {
  const o = vis(f, at, out, 8);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        opacity: o * 0.94,
        fontFamily: FONT.body,
        fontWeight: 800,
        fontSize: 24,
        color: INK,
        background: GOLD,
        border: `3px solid ${INK}`,
        borderRadius: 10,
        padding: "3px 14px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------
// Spark acting: one row per spoken beat → gesture (with anticipation/holds), mood, optional layer.
// Rule: never the same gesture twice in a row (throws, so a still render catches it).
// ---------------------------------------------------------------------------------------------------------
export type Layer = "nod" | "hop" | "wave" | "shake";
export type Act = [frame: number, gesture: GestureName, mood: Mood, layer?: Layer];

export const useActing = (rows: Act[]) => {
  rows.forEach((r, i) => {
    if (i > 0 && rows[i - 1][1] === r[1]) throw new Error(`Spark repeats gesture ${r[1]} at ${r[0]}`);
  });
  const keys: Key[] = gestureKeys(rows.map(([fr, g]) => [fr, G[g], "snap"]));
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

// Spark with staging: `places` move him across the frame / towards the camera (walks while moving)
export const SparkHost: React.FC<{ f: number; rows: Act[]; places: Place[]; bulbs?: number[] }> = ({ f, rows, places, bulbs = [] }) => {
  const { keys, mood, mod } = useActing(rows);
  const sp = sparkAt(f, places, GROUND);
  const bulb = (t: number) => bulbs.reduce((m, b) => Math.max(m, bulbPulse(t, b, 40)), 0);
  const facing = sp.x < 960 ? 1 : -1;
  return (
    <Spark
      f={f}
      scale={sp.s}
      base={{ x: sp.x, y: sp.y }}
      keys={keys}
      mood={mood}
      mod={(t, p) => {
        const q = mod(t, p);
        return sp.moving ? addPose(q, walkCycle(t, 0.3)) : q;
      }}
      talk={(t) => mouthAt(t)}
      bulb={bulb}
      look={facing}
      facing={facing}
    />
  );
};

// where the content group should sit: opposite Spark (Spark left third → content right, and vice versa)
export const contentShift = (f: number, places: Place[]) => {
  const sp = sparkAt(f, places, GROUND);
  return interpolate(sp.x, [420, 1500], [0, -400], clamp);
};

// ---------------------------------------------------------------------------------------------------------
// Screen transitions every ~5.5 s: a full-frame overlay + a new camera framing swapped on the covered frame.
// Cut times snap to the nearest spoken word; kinds rotate (never the same twice in a row).
// ---------------------------------------------------------------------------------------------------------
const ALL_WORDS = VOICE_CUES.flatMap((c) => c.words.map((w) => w.s));
export const cutTimes = (a: number, b: number, every = 160): number[] => {
  const out: number[] = [];
  let t = a + every;
  while (t < b - 70) {
    const near = ALL_WORDS.reduce((m, w) => (Math.abs(w - t) < Math.abs(m - t) ? w : m), t);
    const pick = Math.abs(near - t) < 24 ? near : t;
    out.push(pick);
    t = pick + every;
  }
  return out;
};
const KINDS: TransitionKind[] = ["slice", "whip", "iris", "shutter", "flash"];
export const kindAt = (i: number, seed = 0) => KINDS[(i + seed) % KINDS.length];
export const TCOLS = [PURPLE, MINT, GOLD];

export const Cuts: React.FC<{ f: number; times: number[]; seed?: number; dur?: number }> = ({ f, times, seed = 0, dur = 16 }) => (
  <>
    {times.map((t, i) => (
      <Transition key={i} f={f} at={t} kind={kindAt(i, seed)} colors={TCOLS} dur={dur} irisAt={[960, 480]} />
    ))}
  </>
);

// camera: auto framings on every cut (cycling through `frames`), merged with explicit shots, plus a slow drift
// a frame with at = SPARK frames Spark's head (wherever he is at that moment)
export const SPARK: [number, number] = [-1, -1];
export const CONTENT: [number, number] = [-2, -2]; // push in on the content, framing Spark fully out
export type Frame = Omit<Shot, "f">;
export const sceneCam = (f: number, from: number, times: number[], frames: Frame[], extra: Shot[] = [], places: Place[] = HOST_PLACES_DEFAULT) => {
  const fix = (s: Frame, t: number): Frame => {
    const sp = sparkAt(t + 30, places, GROUND);
    if (s.at === CONTENT) {
      const right = sp.x > 960;
      return { ...s, at: [right ? 640 : 1280, 470] };
    }
    if (s.at !== SPARK) return s;
    return { ...s, at: [sp.x, sp.y - 70 * sp.s] };
  };
  const auto: Shot[] = times.map((t, i) => ({ ...fix(frames[(i + 1) % frames.length], t), f: t, e: "cut" as const }));
  const shots = [{ ...frames[0], f: from, e: "cut" as const }, ...auto, ...extra].sort((a, b) => a.f - b.f);
  const c = camAt(f, shots);
  return { ...c, z: c.z * drift(f, from, 0.025, 300) };
};

export const HOST_PLACES_DEFAULT: Place[] = [{ f: 0, x: 300, s: 1.45 }];
