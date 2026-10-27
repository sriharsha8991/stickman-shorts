import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Actor, addPose, idle, walkCycle, type Key, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake, wave, type GestureName } from "../shared/gestures";
import { camAt, drift, sparkAt, Transition, type Place, type Shot, type TransitionKind } from "../shared/camera";
import { VOICE_CUES, mouthAt } from "./voice";

// L003 · "Why 'Pay in 4' Feels Free (It Isn't)" — one visual world: a NIGHT-MARKET CHECKOUT.
// Neon price tags on strings of bulbs, a giant pizza cutter that slices prices, a pain meter on a wallet,
// and a wobbling tower of payment-plan blocks. Palette: mint + coral on charcoal (amber = the "pick"/warning).
// 16:9 layout: safe x 96–1824 / y 54–1026 · title y 90–330 · action y 360–880 · ground y 880 · captions y 975.

export const CHAR = "#23262b";
export const CHAR2 = "#121418";
export const MINT = "#5ff2c3";
export const MINT_D = "#17a982";
export const CORAL = "#ff6b5b";
export const CORAL_D = "#c63b2f";
export const AMBER = "#ffc94a";
export const PINK = "#ff4fa3";
export const PAPER = "#fff6ea";
export const PAPER2 = "#f1e2c8";
export const INK = COL.ink;
export const GROUND = 880;
export const YOU_COL = "#ff9a3c"; // channel convention: YOU = orange

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
export const rupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// ---------------------------------------------------------------------------------------------------------
// Backgrounds (one per chapter so the staging visibly changes)
//   market — night market: string lights, stall awnings, neon glow (hook + CH1)
//   brain  — mint lab grid with a faint brain-wave line (CH2)
//   slice  — warm coral kitchen-counter checker (CH3)
//   city   — dark skyline of block towers, searchlights (CH4)
//   hall   — cool blue-grey hall with columns and a rule-book glow (CH5)
//   dawn   — mint-to-peach sunrise over the market (wrap)
// ---------------------------------------------------------------------------------------------------------
export type BgKind = "market" | "brain" | "slice" | "city" | "hall" | "dawn";
const BG: Record<BgKind, [string, string, boolean]> = {
  market: ["#1d2027", "#0e1014", true],
  brain: ["#e8fbf4", "#c3f0df", false],
  slice: ["#fff0e8", "#ffd2c2", false],
  city: ["#1a1d2b", "#0b0d16", true],
  hall: ["#dfe7ef", "#b9c8d8", false],
  dawn: ["#d9fbef", "#ffd9c4", false],
};
export const Bg: React.FC<{ f: number; kind: BgKind }> = ({ f, kind }) => {
  const [top, bot, dark] = BG[kind];
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id={`l3bg-${kind}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={top} />
            <stop offset="100%" stopColor={bot} />
          </linearGradient>
          <radialGradient id={`l3glow-${kind}`} cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor={dark ? MINT : "#ffffff"} stopOpacity={dark ? 0.18 : 0.6} />
            <stop offset="100%" stopColor={top} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={1920} height={1080} fill={`url(#l3bg-${kind})`} />
        <rect width={1920} height={1080} fill={`url(#l3glow-${kind})`} />
        {kind === "market" && (
          <g>
            {/* stall awnings (coral/mint stripes) in the back */}
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} transform={`translate(${i * 420 - 60} 560)`} opacity={0.55}>
                <rect x={0} y={0} width={360} height={320} fill="#2c3038" />
                {Array.from({ length: 6 }, (_, k) => (
                  <path key={k} d={`M ${k * 60} 0 L ${k * 60 + 60} 0 L ${k * 60 + 60} 60 Q ${k * 60 + 30} 90 ${k * 60} 60 Z`} fill={k % 2 ? CORAL : PAPER} opacity={0.85} />
                ))}
                <rect x={40} y={130} width={280} height={14} rx={7} fill={i % 2 ? MINT : PINK} opacity={0.5 + 0.3 * Math.sin(f / 9 + i)} />
              </g>
            ))}
            {/* string lights */}
            {[0, 1].map((row) => (
              <g key={row}>
                <path d={`M -20 ${120 + row * 90} Q 480 ${220 + row * 90} 960 ${130 + row * 90} T 1940 ${140 + row * 90}`} stroke="#555a66" strokeWidth={4} fill="none" />
                {Array.from({ length: 18 }, (_, i) => {
                  const x = i * 112 + row * 50;
                  const t = x / 1920;
                  const y = 120 + row * 90 + Math.sin(t * Math.PI * 2) * 48 + 30;
                  const on = 0.55 + 0.45 * Math.sin(f / 7 + i * 1.7 + row);
                  const c = [AMBER, MINT, CORAL, PINK][(i + row) % 4];
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r={22} fill={c} opacity={0.18 * on} />
                      <circle cx={x} cy={y} r={9} fill={c} opacity={0.6 + 0.4 * on} />
                    </g>
                  );
                })}
              </g>
            ))}
          </g>
        )}
        {kind === "brain" && (
          <g>
            {Array.from({ length: 33 }, (_, i) => (
              <line key={i} x1={i * 60} x2={i * 60} y1={0} y2={1080} stroke={MINT_D} strokeOpacity={0.12} strokeWidth={2} />
            ))}
            {Array.from({ length: 19 }, (_, i) => (
              <line key={`h${i}`} x1={0} x2={1920} y1={i * 60} y2={i * 60} stroke={MINT_D} strokeOpacity={0.12} strokeWidth={2} />
            ))}
            <path
              d={Array.from({ length: 97 }, (_, i) => `${i ? "L" : "M"} ${i * 20} ${200 + Math.sin(i / 3 + f / 8) * 26 * (1 + Math.sin(i / 11))}`).join(" ")}
              stroke={MINT_D}
              strokeOpacity={0.3}
              strokeWidth={5}
              fill="none"
            />
          </g>
        )}
        {kind === "slice" &&
          Array.from({ length: 12 }, (_, r) =>
            Array.from({ length: 21 }, (_, c) => ((r + c) % 2 ? <rect key={`${r}-${c}`} x={c * 96 - ((f * 0.3) % 96)} y={r * 96} width={96} height={96} fill={CORAL} opacity={0.07} /> : null)),
          )}
        {kind === "city" && (
          <g>
            {Array.from({ length: 4 }, (_, i) => {
              const a = Math.sin(f / 40 + i * 1.6) * 18;
              return <path key={`s${i}`} d={`M ${300 + i * 440} 900 L ${300 + i * 440 + a * 10 - 120} -40 L ${300 + i * 440 + a * 10 + 120} -40 Z`} fill={MINT} opacity={0.05} />;
            })}
            {Array.from({ length: 16 }, (_, i) => {
              const h = 160 + ((i * 137) % 300);
              const x = i * 124 - 20;
              return (
                <g key={i}>
                  <rect x={x} y={GROUND - h} width={104} height={h} fill="#262a3a" />
                  {Array.from({ length: Math.floor(h / 46) }, (_, k) => (
                    <rect key={k} x={x + 18 + (k % 2) * 40} y={GROUND - h + 20 + k * 46} width={26} height={18} fill={AMBER} opacity={(i * 7 + k * 3) % 5 ? 0.12 : 0.5} />
                  ))}
                </g>
              );
            })}
          </g>
        )}
        {kind === "hall" && (
          <g>
            {[180, 560, 1360, 1740].map((x, i) => (
              <g key={i} opacity={0.45}>
                <rect x={x - 46} y={150} width={92} height={GROUND - 150} fill="#f4f7fa" stroke="#8aa0b5" strokeWidth={4} />
                <rect x={x - 66} y={130} width={132} height={30} fill="#f4f7fa" stroke="#8aa0b5" strokeWidth={4} />
                {[-24, 0, 24].map((d) => (
                  <line key={d} x1={x + d} x2={x + d} y1={170} y2={GROUND - 10} stroke="#8aa0b5" strokeWidth={3} />
                ))}
              </g>
            ))}
            <path d="M 160 130 L 960 40 L 1760 130 Z" fill="#f4f7fa" stroke="#8aa0b5" strokeWidth={4} opacity={0.45} />
          </g>
        )}
        {kind === "dawn" && (
          <g>
            <circle cx={960} cy={GROUND + 40} r={300 + Math.sin(f / 30) * 6} fill={AMBER} opacity={0.35} />
            <circle cx={960} cy={GROUND + 40} r={200} fill={AMBER} opacity={0.5} />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI - Math.PI;
              return <line key={i} x1={960 + Math.cos(a) * 340} y1={GROUND + 40 + Math.sin(a) * 340} x2={960 + Math.cos(a) * 520} y2={GROUND + 40 + Math.sin(a) * 520} stroke={AMBER} strokeWidth={10} strokeLinecap="round" opacity={0.35} />;
            })}
          </g>
        )}
        {/* floor */}
        <rect x={0} y={GROUND} width={1920} height={200} fill={dark ? "#0a0b0e" : kind === "hall" ? "#a7b6c6" : "#e9cfb4"} opacity={0.95} />
        <line x1={0} x2={1920} y1={GROUND} y2={GROUND} stroke={dark ? MINT : INK} strokeWidth={5} opacity={dark ? 0.7 : 1} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------
// a hanging price tag with a string hole. `text` big, `sub` small. glow for neon.
export const PriceTag: React.FC<{ x: number; y: number; text: string; sub?: string; s?: number; o?: number; r?: number; w?: number; fill?: string; color?: string; glow?: number; fs?: number }> = ({
  x,
  y,
  text,
  sub,
  s = 1,
  o = 1,
  r = 0,
  w = 460,
  fill = PAPER,
  color = INK,
  glow = 0,
  fs = 110,
}) => {
  if (o <= 0.01 || s <= 0.01) return null;
  const h = sub ? 260 : 210;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      {glow > 0 && <rect x={-w / 2 - 70} y={-h / 2 - 24} width={w + 100} height={h + 48} rx={40} fill={MINT} opacity={0.35 * glow} />}
      <path d={`M ${-w / 2 - 60} 0 L ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2} L ${w / 2} ${h / 2} L ${-w / 2} ${h / 2} Z`} fill={fill} {...K} strokeWidth={7} />
      <circle cx={-w / 2 - 14} cy={0} r={16} fill={CHAR} {...K} strokeWidth={4} />
      <text x={30} y={sub ? -4 : fs * 0.36} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={fs} fill={color}>
        {text}
      </text>
      {sub && (
        <text x={30} y={80} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={40} fill={color} opacity={0.75}>
          {sub}
        </text>
      )}
    </g>
  );
};

// a giant pizza cutter (wheel + handle). spin = wheel angle in degrees
export const Cutter: React.FC<{ x: number; y: number; s?: number; r?: number; spin?: number; o?: number }> = ({ x, y, s = 1, r = 0, spin = 0, o = 1 }) =>
  o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <rect x={-22} y={-330} width={44} height={240} rx={22} fill={CORAL} {...K} strokeWidth={6} />
      <rect x={-12} y={-100} width={24} height={60} fill="#c9ced6" {...K} strokeWidth={5} />
      <g transform={`rotate(${spin})`}>
        <circle r={110} fill="#e9edf2" {...K} strokeWidth={7} />
        <circle r={96} fill="none" stroke="#ffffff" strokeWidth={6} opacity={0.7} />
        {[0, 60, 120].map((a) => (
          <line key={a} x1={Math.cos((a * Math.PI) / 180) * -70} y1={Math.sin((a * Math.PI) / 180) * -70} x2={Math.cos((a * Math.PI) / 180) * 70} y2={Math.sin((a * Math.PI) / 180) * 70} stroke="#aab2bd" strokeWidth={6} />
        ))}
        <circle r={22} fill={MINT} {...K} strokeWidth={5} />
      </g>
    </g>
  );

// a semicircular pain meter (0..1) with a needle, labels NO PAIN / OUCH
export const PainMeter: React.FC<{ x: number; y: number; v: number; s?: number; o?: number; label?: string; dark?: boolean }> = ({ x, y, v, s = 1, o = 1, label = "PAIN OF PAYING", dark = false }) => {
  if (o <= 0.01 || s <= 0.01) return null;
  const a = -180 + 180 * Math.max(0, Math.min(1.05, v));
  const R = 220;
  const seg = (a0: number, a1: number, c: string) => {
    const p0 = [Math.cos((a0 * Math.PI) / 180) * R, Math.sin((a0 * Math.PI) / 180) * R];
    const p1 = [Math.cos((a1 * Math.PI) / 180) * R, Math.sin((a1 * Math.PI) / 180) * R];
    return <path d={`M 0 0 L ${p0[0]} ${p0[1]} A ${R} ${R} 0 0 1 ${p1[0]} ${p1[1]} Z`} fill={c} />;
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <rect x={-R - 40} y={-R - 40} width={2 * R + 80} height={R + 110} rx={36} fill={dark ? CHAR : "#ffffff"} {...K} strokeWidth={7} />
      {seg(-180, -120, MINT)}
      {seg(-120, -60, AMBER)}
      {seg(-60, 0, CORAL)}
      <circle r={R * 0.62} fill={dark ? CHAR : "#ffffff"} />
      <path d={`M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0`} fill="none" {...K} strokeWidth={6} />
      <g transform={`rotate(${a})`}>
        <path d={`M 0 -10 L ${R - 24} 0 L 0 10 Z`} fill={INK} />
      </g>
      <circle r={22} fill={CORAL} {...K} strokeWidth={5} />
      <text x={-R + 10} y={44} fontFamily={FONT.title} fontWeight={800} fontSize={30} fill={dark ? "#fff" : INK}>
        CALM
      </text>
      <text x={R - 10} y={44} textAnchor="end" fontFamily={FONT.title} fontWeight={800} fontSize={30} fill={dark ? "#fff" : INK}>
        OUCH
      </text>
      <text x={0} y={52} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={dark ? MINT : CORAL_D}>
        {label}
      </text>
    </g>
  );
};

// a wallet (fold), optional coins flying out
export const Wallet: React.FC<{ x: number; y: number; s?: number; o?: number; open?: number }> = ({ x, y, s = 1, o = 1, open = 0 }) =>
  o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <rect x={-150} y={-90} width={300} height={180} rx={26} fill="#7a4a2a" {...K} strokeWidth={6} />
      <rect x={-150} y={-90 - 30 * open} width={300} height={70} rx={20} fill="#946038" {...K} strokeWidth={6} />
      <rect x={60} y={-20} width={110} height={60} rx={14} fill="#946038" {...K} strokeWidth={5} />
      <circle cx={140} cy={10} r={10} fill={AMBER} />
    </g>
  );

// a phone checkout screen (16:9 world: phone held up big)
export const Phone: React.FC<{ x: number; y: number; s?: number; o?: number; r?: number; children?: React.ReactNode }> = ({ x, y, s = 1, o = 1, r = 0, children }) =>
  o <= 0.01 || s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <rect x={-200} y={-360} width={400} height={720} rx={50} fill={CHAR2} {...K} strokeWidth={7} />
      <rect x={-178} y={-326} width={356} height={652} rx={30} fill={PAPER} />
      <rect x={-50} y={-346} width={100} height={14} rx={7} fill="#3a3e46" />
      {children}
    </g>
  );

// one payment-plan block for the tower (label + "1 of 4" pips)
export const PlanBlock: React.FC<{ x: number; y: number; label: string; fill?: string; s?: number; o?: number; r?: number; paid?: number }> = ({ x, y, label, fill = MINT, s = 1, o = 1, r = 0, paid = 1 }) =>
  o <= 0.01 || s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <rect x={-180} y={-55} width={360} height={110} rx={18} fill={fill} {...K} strokeWidth={6} />
      <rect x={-166} y={-46} width={332} height={14} rx={7} fill="#ffffff" opacity={0.35} />
      <text x={-150} y={18} fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={INK}>
        {label}
      </text>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={70 + i * 30} cy={8} r={11} fill={i < paid ? INK : "#ffffff"} stroke={INK} strokeWidth={4} />
      ))}
    </g>
  );

// a clipboard checklist with up to 3 lines; ticks[i] = frame the tick draws
export const Clipboard: React.FC<{ x: number; y: number; lines: string[]; f: number; ticks: number[]; s?: number; o?: number; r?: number }> = ({ x, y, lines, f, ticks, s = 1, o = 1, r = 0 }) =>
  o <= 0.01 || s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <rect x={-330} y={-280} width={660} height={560} rx={24} fill="#b77b47" {...K} strokeWidth={7} />
      <rect x={-300} y={-240} width={600} height={500} rx={12} fill={PAPER} {...K} strokeWidth={5} />
      <rect x={-90} y={-300} width={180} height={64} rx={16} fill="#c9ced6" {...K} strokeWidth={6} />
      {lines.map((l, i) => {
        const yy = -130 + i * 150;
        const d = f - ticks[i];
        const k = interpolate(d, [0, 8], [0, 1], clamp);
        return (
          <g key={i}>
            <rect x={-270} y={yy - 40} width={70} height={70} rx={12} fill="#ffffff" {...K} strokeWidth={5} />
            {d >= 0 && (
              <path d={`M -258 ${yy - 2} L -238 ${yy + 22} L -206 ${yy - 30}`} fill="none" stroke={MINT_D} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
            )}
            <foreignObject x={-180} y={yy - 56} width={460} height={130}>
              <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: INK, lineHeight: 1.15 }}>{l}</div>
            </foreignObject>
          </g>
        );
      })}
    </g>
  );

// a pie-like price slice (for the "taste the first slice" beat)
export const Slice: React.FC<{ x: number; y: number; s?: number; r?: number; o?: number; text?: string; fill?: string }> = ({ x, y, s = 1, r = 0, o = 1, text, fill = AMBER }) =>
  o <= 0.01 || s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <path d="M 0 -150 L 120 110 Q 0 150 -120 110 Z" fill={fill} {...K} strokeWidth={6} />
      <path d="M -120 110 Q 0 150 120 110 L 110 90 Q 0 128 -110 90 Z" fill={CORAL} opacity={0.8} />
      {text && (
        <text x={0} y={70} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={INK}>
          {text}
        </text>
      )}
    </g>
  );

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
      <path d={`M ${w / 2 - 70} ${-h / 2} L ${w / 2} ${-h / 2 + 70} L ${w / 2 - 70} ${-h / 2 + 70} Z`} fill={PAPER2} {...K} />
      {title.map((t, i) => (
        <text key={i} x={0} y={-h / 2 + 90 + i * 52} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={48} fill={INK}>
          {t}
        </text>
      ))}
      <text x={0} y={-h / 2 + 100 + title.length * 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={26} fill={CORAL_D}>
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
            <rect x={-w / 2 + 34} y={qy - 38} width={(w - 68) * k} height={50} rx={8} fill={AMBER} opacity={0.75} />
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
export const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; k?: number; color?: string; w?: number }> = ({ x1, y1, x2, y2, k = 1, color = CORAL_D, w = 12 }) => {
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
        background: "rgba(21,23,27,0.85)",
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
        background: AMBER,
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
export const TCOLS = [CORAL_D, MINT, AMBER];

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

// ---------------------------------------------------------------------------------------------------------
// YOU (plain orange engine figure, labelled). beats = [frame, gesture]; face changes over time.
// ---------------------------------------------------------------------------------------------------------
export const youHead = (x: number, s = 1.3): [number, number] => [x, GROUND - 92.5 * s - 105 * s];
export const You: React.FC<{ f: number; x: number; s?: number; beats: [number, GestureName][]; face?: (t: number) => "eyes" | "sad" | "happy" | "angry"; o?: number; facing?: number; walk?: boolean }> = ({
  f,
  x,
  s = 1.3,
  beats,
  face = () => "eyes",
  o = 1,
  facing = -1,
  walk = false,
}) => {
  if (o <= 0.01) return null;
  const keys: Key[] = gestureKeys(beats.map(([fr, gn]) => [fr, G[gn], "snap"]));
  return (
    <Actor
      f={f}
      keys={keys}
      color={YOU_COL}
      base={{ x, y: GROUND - 92.5 * s }}
      scale={s}
      facing={facing}
      face={face(f)}
      label="YOU"
      opacity={o}
      mod={(t, p) => {
        const q = addPose(p, idle(t, 3));
        return walk ? addPose(q, walkCycle(t, 0.3)) : q;
      }}
    />
  );
};
