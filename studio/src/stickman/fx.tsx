import React from "react";
import { AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

// Fonts are bundled locally in public/fonts (from @fontsource), so renders work offline
// and without access to Google Fonts.
const LOCAL_FONTS: [string, string, string][] = [
  ["Bangers", "bangers", "400"],
  ["Barlow Condensed", "barlow-condensed", "600"],
  ["Barlow Condensed", "barlow-condensed", "800"],
  ["Barlow Condensed", "barlow-condensed", "900"],
  ["Inter", "inter", "500"],
  ["Inter", "inter", "700"],
  ["Inter", "inter", "800"],
];
for (const [family, file, weight] of LOCAL_FONTS) {
  loadFont({ family, url: staticFile(`fonts/${file}-latin-${weight}-normal.woff2`), weight, format: "woff2" });
}

export const FONT = {
  comic: "Bangers",
  title: "'Barlow Condensed'",
  body: "Inter",
};

export const COL = {
  paper: "#fafaf7",
  ink: "#1a1a1a",
  orange: "#f7941d",
  blue: "#2b7de9",
  green: "#2fa84f",
  red: "#e5322d",
  yellow: "#f2c12e",
  purple: "#8e44ad",
  grey: "#8a8a8a",
  dollar: "#3a8f3e",
  gold: "#f2b705",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.bezier(0.2, 0.9, 0.25, 1)) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: e });

// camera shake: decays after each hit
export const shakeAt = (f: number, hits: number[], power = 18, len = 12) => {
  let x = 0,
    y = 0,
    r = 0;
  for (const h of hits) {
    const d = f - h;
    if (d >= 0 && d < len) {
      const k = (1 - d / len) ** 2 * power;
      x += (random(`sx${h}-${d}`) - 0.5) * 2 * k;
      y += (random(`sy${h}-${d}`) - 0.5) * 2 * k;
      r += (random(`sr${h}-${d}`) - 0.5) * k * 0.08;
    }
  }
  return { x, y, r };
};

export const Shake: React.FC<{ hits: number[]; power?: number; children: React.ReactNode }> = ({ hits, power, children }) => {
  const f = useCurrentFrame();
  const s = shakeAt(f, hits, power);
  return <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg)` }}>{children}</AbsoluteFill>;
};

// paper background with soft vignette and a faint ground line
export const Paper: React.FC<{ tint?: string; ground?: number }> = ({ tint = COL.paper, ground = 862 }) => {
  const { width, height } = useVideoConfig();
  return (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 45%, ${tint} 55%, #e9e7df 100%)`,
    }}
  >
    <svg width={width} height={height} style={{ position: "absolute", opacity: 0.35 }}>
      <line x1={0} y1={ground} x2={width} y2={ground} stroke="#cfccc2" strokeWidth={3} />
    </svg>
  </AbsoluteFill>
  );
};

// comic-style impact starburst
export const Burst: React.FC<{ x: number; y: number; at: number; f: number; color?: string; size?: number; n?: number }> = ({
  x,
  y,
  at,
  f,
  color = COL.ink,
  size = 160,
  n = 14,
}) => {
  const d = f - at;
  if (d < 0 || d > 14) return null;
  const t = d / 14;
  const r0 = size * (0.25 + t * 0.9);
  const r1 = size * (0.45 + t * 1.25);
  return (
    <g opacity={1 - t}>
      {d < 3 && <circle cx={x} cy={y} r={size * 0.55} fill="#fff" stroke={color} strokeWidth={8} />}
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + random(`b${at}${i}`) * 0.3;
        const k = 0.7 + random(`bl${at}${i}`) * 0.6;
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * r0}
            y1={y + Math.sin(a) * r0}
            x2={x + Math.cos(a) * r1 * k}
            y2={y + Math.sin(a) * r1 * k}
            stroke={color}
            strokeWidth={10 * (1 - t) + 2}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

// dust puffs when something lands
export const Dust: React.FC<{ x: number; y: number; at: number; f: number; spread?: number }> = ({ x, y, at, f, spread = 120 }) => {
  const d = f - at;
  if (d < 0 || d > 22) return null;
  const t = d / 22;
  return (
    <g opacity={1 - t}>
      {Array.from({ length: 8 }).map((_, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const k = 0.4 + random(`d${at}${i}`) * 0.8;
        return (
          <circle
            key={i}
            cx={x + side * spread * k * Math.sqrt(t)}
            cy={y - 30 * k * t - 6}
            r={(10 + 18 * k) * (0.6 + t)}
            fill="none"
            stroke="#b9b5aa"
            strokeWidth={5}
          />
        );
      })}
    </g>
  );
};

// horizontal speed lines
export const SpeedLines: React.FC<{ f: number; from: number; to: number; dir?: number; color?: string }> = ({ f, from, to, dir = 1, color = "#d8d4c8" }) => {
  if (f < from || f > to) return null;
  const o = interpolate(f, [from, from + 4, to - 4, to], [0, 1, 1, 0], clamp);
  return (
    <g opacity={o}>
      {Array.from({ length: 18 }).map((_, i) => {
        const y = 80 + random(`sl${i}`) * 920;
        const len = 200 + random(`sll${i}`) * 500;
        const x = ((random(`slx${i}`) * 2400 - f * 90 * dir) % 2400 + 2400) % 2400 - 240;
        return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke={color} strokeWidth={4 + random(`slw${i}`) * 6} strokeLinecap="round" />;
      })}
    </g>
  );
};

// text that slams onto the screen with overshoot
export const Slam: React.FC<{
  f: number;
  at: number;
  children: React.ReactNode;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  font?: string;
  rotate?: number;
  out?: number;
  stroke?: string;
  weight?: number;
  spacing?: number;
}> = ({ f, at, children, x = 960, y = 540, size = 120, color = COL.ink, font = FONT.comic, rotate = 0, out, stroke, weight = 400, spacing = 2 }) => {
  const d = f - at;
  if (d < 0) return null;
  const s = interpolate(d, [0, 5, 9, 13], [3.2, 0.92, 1.05, 1], clamp);
  let o = interpolate(d, [0, 3], [0, 1], clamp);
  if (out !== undefined) o *= interpolate(f, [out, out + 8], [1, 0], clamp);
  const blur = interpolate(d, [0, 5], [8, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(${rotate}deg)`,
        opacity: o,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        color,
        whiteSpace: "nowrap",
        letterSpacing: spacing,
        lineHeight: 1,
        WebkitTextStroke: stroke,
        paintOrder: "stroke fill",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
};

// pill-shaped caption that slides in
export const Caption: React.FC<{
  f: number;
  at: number;
  out?: number;
  x?: number;
  y?: number;
  children: React.ReactNode;
  bg?: string;
  color?: string;
  size?: number;
  align?: "left" | "center";
}> = ({ f, at, out, x = 960, y = 980, children, bg = COL.ink, color = "#fff", size = 40, align = "center" }) => {
  const d = f - at;
  if (d < 0) return null;
  const t = ease(f, at, at + 10);
  let o = t;
  if (out !== undefined) o *= interpolate(f, [out, out + 8], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${align === "center" ? "-50%" : "0"}, -50%) translateY(${(1 - t) * 40}px)`,
        opacity: o,
        background: bg,
        color,
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: size,
        padding: "14px 30px",
        borderRadius: 14,
        whiteSpace: "nowrap",
        boxShadow: "0 8px 0 rgba(0,0,0,0.12)",
      }}
    >
      {children}
    </div>
  );
};

// typewriter
export const Type: React.FC<{ f: number; at: number; text: string; cps?: number; style?: React.CSSProperties; caret?: boolean }> = ({
  f,
  at,
  text,
  cps = 1.4,
  style,
  caret = true,
}) => {
  const n = Math.max(0, Math.floor((f - at) * cps));
  if (f < at) return null;
  const shown = text.slice(0, n);
  const blink = caret && n < text.length + 10 && Math.floor(f / 8) % 2 === 0;
  return (
    <span style={style}>
      {shown}
      <span style={{ opacity: blink ? 1 : 0 }}>▌</span>
    </span>
  );
};

// mouse cursor (the animator's hand: draw characters, get grabbed, get thrown)
export const Cursor: React.FC<{ x: number; y: number; scale?: number; pressed?: boolean }> = ({ x, y, scale = 1.6, pressed }) => (
  <g transform={`translate(${x} ${y}) scale(${scale * (pressed ? 0.88 : 1)})`}>
    <path d="M0,0 L0,34 L8,26 L14,40 L20,37 L14,24 L25,24 Z" fill="#fff" stroke="#000" strokeWidth={2.4} strokeLinejoin="round" />
  </g>
);

// counting number
export const countUp = (f: number, a: number, b: number, to: number, from = 0) =>
  Math.round(interpolate(f, [a, b], [from, to], { ...clamp, easing: Easing.out(Easing.cubic) }));

export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// diagonal black wipe transition
export const Wipe: React.FC<{ f: number; dur: number; color?: string }> = ({ f, dur, color = COL.ink }) => {
  const inT = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const outT = interpolate(f, [dur - 10, dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // in: the wipe exits to the right; out: it enters from the left
  const showIn = f < 10;
  const showOut = f > dur - 10;
  if (!showIn && !showOut) return null;
  const x = showIn ? inT * 2600 : -2600 + outT * 2600;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x - 300,
          top: -200,
          width: 2600,
          height: 1500,
          background: color,
          transform: "skewX(-14deg)",
        }}
      />
    </AbsoluteFill>
  );
};
