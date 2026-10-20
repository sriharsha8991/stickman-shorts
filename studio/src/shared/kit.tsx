import React from "react";
import { AbsoluteFill, interpolate, random, spring } from "remotion";
import { COL, FONT, Paper } from "../stickman/fx";
import { groundY } from "../stickman/stick";

// ---------------------------------------------------------------------------
// Shared toolkit for vertical shorts (import from "../shared/kit"). Originally built for V002.
// Layout (1080x1920). Zones: title y 260-620 · action y 650-1290 · captions ~1400.
// ---------------------------------------------------------------------------
export const GROUND = 1290;
export const S = 1.55;
export const GY = groundY(S, GROUND);
export const FPS = 30;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const K = { stroke: COL.ink, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

// punch-in zoom: a quick 1.0 -> 1+amt -> 1.0 kick, used as a pattern interrupt on beats
export const punch = (f: number, ats: number[], amt = 0.07) =>
  1 + ats.reduce((z, at) => (f < at ? z : z + amt * Math.exp(-(f - at) / 5)), 0);

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------
export const DayBg: React.FC<{ tint?: string }> = ({ tint }) => <Paper ground={GROUND} tint={tint} />;

export const NightBg: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #0c1230 0%, #18224a 62%, #222d5c 100%)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {Array.from({ length: 34 }, (_, i) => {
        const x = random(`sx${i}`) * 1080;
        const y = 120 + random(`sy${i}`) * 1000;
        const tw = 0.35 + 0.35 * Math.sin(f * 0.08 + i);
        return <circle key={i} cx={x} cy={y} r={1.5 + random(`sr${i}`) * 2.2} fill="#fff" opacity={tw} />;
      })}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke="#3a4680" strokeWidth={3} />
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#141b3d" opacity={0.6} />
    </svg>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export const BED = { x0: 110, x1: 740, top: 1165 };

export const Bed: React.FC = () => (
  <g>
    <rect x={BED.x0} y={BED.top} width={BED.x1 - BED.x0} height={GROUND - BED.top} rx={14} fill="#3d4f8f" {...K} />
    <rect x={BED.x0 - 20} y={BED.top - 150} width={34} height={GROUND - BED.top + 150} rx={10} fill="#2c3a6e" {...K} />
    <rect x={BED.x0 + 22} y={BED.top - 46} width={150} height={56} rx={26} fill="#e8ecf8" {...K} />
  </g>
);

// blanket over the legs, drawn after the character
export const Blanket: React.FC = () => (
  <path
    d={`M 330 ${BED.top + 8} Q 420 ${BED.top - 60} 560 ${BED.top - 48} Q 680 ${BED.top - 40} 740 ${BED.top + 4} L 740 ${BED.top + 40} L 330 ${BED.top + 40} Z`}
    fill="#6f86d6"
    {...K}
  />
);

export const Nightstand: React.FC<{ clock: string; f: number }> = ({ clock, f }) => (
  <g>
    <rect x={800} y={1110} width={190} height={GROUND - 1110} rx={8} fill="#4a3b2c" {...K} />
    <line x1={800} y1={1180} x2={990} y2={1180} stroke={COL.ink} strokeWidth={5} />
    {/* digital clock */}
    <rect x={820} y={1030} width={150} height={80} rx={12} fill="#111" {...K} />
    <text
      x={895}
      y={1088}
      textAnchor="middle"
      fontFamily={FONT.title}
      fontWeight={800}
      fontSize={56}
      fill="#ff4d4d"
      opacity={0.75 + 0.25 * Math.sin(f * 0.2)}
    >
      {clock}
    </text>
  </g>
);

// phone; `glow` lights the screen, `scroll` moves the feed inside
export const Phone: React.FC<{ x: number; y: number; s?: number; r?: number; glow?: number; scroll?: number; spinner?: number }> = ({
  x,
  y,
  s = 1,
  r = 0,
  glow = 1,
  scroll = 0,
  spinner = 0,
}) => {
  const w = 74;
  const h = 136;
  const cards = Array.from({ length: 6 }, (_, i) => {
    const cy = (((i * 34 - scroll) % 204) + 204) % 204 - 70;
    return <rect key={i} x={-26} y={cy} width={52} height={24} rx={5} fill={i % 3 === 0 ? "#ffd166" : "#ffffff"} opacity={0.9} />;
  });
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill="#1b1b1b" {...K} strokeWidth={5} />
      <clipPath id="phoneScreen">
        <rect x={-30} y={-58} width={60} height={116} rx={8} />
      </clipPath>
      <rect x={-30} y={-58} width={60} height={116} rx={8} fill="#5ec8ff" opacity={0.35 + 0.65 * glow} />
      <g clipPath="url(#phoneScreen)">{cards}</g>
      {spinner > 0 && (
        <g transform={`translate(0 -40) rotate(${spinner * 720})`} opacity={Math.min(1, spinner * 4)}>
          <circle r={9} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="40 20" />
        </g>
      )}
    </g>
  );
};

// soft light cast by a phone screen
export const Glow: React.FC<{ x: number; y: number; r?: number; o?: number }> = ({ x, y, r = 260, o = 0.55 }) => (
  <>
    <defs>
      <radialGradient id={`glow${Math.round(x)}${Math.round(y)}`}>
        <stop offset="0%" stopColor="#8fdcff" stopOpacity={o} />
        <stop offset="100%" stopColor="#8fdcff" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r} fill={`url(#glow${Math.round(x)}${Math.round(y)})`} />
  </>
);

export const Heart: React.FC<{ s?: number; color?: string }> = ({ s = 1, color = COL.red }) => (
  <path
    transform={`scale(${s})`}
    d="M0 22 C -34 -2, -30 -34, -8 -30 C -2 -29, 0 -24, 0 -20 C 0 -24, 2 -29, 8 -30 C 30 -34, 34 -2, 0 22 Z"
    fill={color}
    {...K}
    strokeWidth={5}
  />
);

const BubbleIcon: React.FC = () => (
  <g>
    <rect x={-30} y={-24} width={60} height={40} rx={12} fill={COL.blue} {...K} strokeWidth={5} />
    <path d="M -10 16 L -18 30 L 2 16 Z" fill={COL.blue} {...K} strokeWidth={5} />
  </g>
);

const Nothing: React.FC = () => (
  <g>
    <circle r={26} fill="#cfcfcf" {...K} strokeWidth={5} />
    <line x1={-12} y1={-12} x2={12} y2={12} stroke={COL.ink} strokeWidth={6} strokeLinecap="round" />
    <line x1={12} y1={-12} x2={-12} y2={12} stroke={COL.ink} strokeWidth={6} strokeLinecap="round" />
  </g>
);

export type Sym = "heart" | "bubble" | "none";
const SYMS: Sym[] = ["heart", "bubble", "none"];
const SymIcon: React.FC<{ s: Sym }> = ({ s }) => (s === "heart" ? <Heart s={1.15} /> : s === "bubble" ? <BubbleIcon /> : <Nothing />);

// one reel: spins between [start, stop] frames and lands on `land`
const Reel: React.FC<{ f: number; x: number; y: number; spins: { start: number; stop: number; land: Sym }[]; idle: Sym }> = ({ f, x, y, spins, idle }) => {
  let shown: Sym = idle;
  let spinning = false;
  let offset = 0;
  let landT = 1;
  for (const sp of spins) {
    if (f >= sp.stop) {
      shown = sp.land;
      landT = Math.min(1, (f - sp.stop) / 6);
    } else if (f >= sp.start) {
      spinning = true;
      offset = (f - sp.start) * 46;
    }
  }
  const W = 128;
  const H = 150;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={14} fill="#fff" {...K} />
      <clipPath id={`reel${x}`}>
        <rect x={-W / 2 + 4} y={-H / 2 + 4} width={W - 8} height={H - 8} rx={10} />
      </clipPath>
      <g clipPath={`url(#reel${x})`}>
        {spinning ? (
          [-1, 0, 1].map((k) => {
            const yy = ((offset + k * 90) % 270) - 135;
            return (
              <g key={k} transform={`translate(0 ${yy}) scale(1 1.4)`} opacity={0.75}>
                <SymIcon s={SYMS[(Math.floor(offset / 90) + k + 3) % 3]} />
              </g>
            );
          })
        ) : (
          <g transform={`translate(0 ${(1 - landT) * -26}) scale(${1 + (1 - landT) * 0.2})`}>
            <SymIcon s={shown} />
          </g>
        )}
      </g>
    </g>
  );
};

// the slot machine ("PULL TO REFRESH" casino cabinet). (x, y) = centre of the reels.
export const SlotMachine: React.FC<{
  f: number;
  x: number;
  y: number;
  s?: number;
  spins: { start: number; stops: [number, number, number]; land: [Sym, Sym, Sym] }[];
  lights?: boolean;
}> = ({ f, x, y, s = 1, spins, lights = true }) => {
  const reelSpins = (i: number) => spins.map((sp) => ({ start: sp.start, stop: sp.stops[i], land: sp.land[i] }));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* cabinet */}
      <rect x={-250} y={-250} width={500} height={470} rx={36} fill="#d7263d" {...K} />
      <rect x={-210} y={-330} width={420} height={110} rx={24} fill={COL.gold} {...K} />
      <text y={-258} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill={COL.ink} letterSpacing={2}>
        PULL TO REFRESH
      </text>
      {lights &&
        Array.from({ length: 9 }, (_, i) => (
          <circle
            key={i}
            cx={-200 + i * 50}
            cy={-338}
            r={9}
            fill={(Math.floor(f / 4) + i) % 2 === 0 ? "#fff6a8" : "#c99a00"}
            {...K}
            strokeWidth={3}
          />
        ))}
      <rect x={-215} y={-110} width={430} height={200} rx={22} fill="#2b2b2b" {...K} />
      {[-140, 0, 140].map((rx, i) => (
        <Reel key={i} f={f} x={rx} y={-10} spins={reelSpins(i)} idle={(["heart", "bubble", "heart"] as Sym[])[i]} />
      ))}
      {/* coin tray */}
      <rect x={-150} y={140} width={300} height={50} rx={12} fill="#9e1b2c" {...K} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Kinetic captions (caption-animation skill): words pop in one by one with a spring,
// the newest word bumps, key words stay highlighted. 4-7 words per page, centred,
// inside the 900px safe width, above the bottom 320px platform UI.
// ---------------------------------------------------------------------------
export type Page = { at: number; text: string; hi?: string[] };

export const Kinetic: React.FC<{ f: number; pages: Page[]; end: number; y?: number; size?: number; step?: number }> = ({
  f,
  pages,
  end,
  y = 1420,
  size = 70,
  step = 3,
}) => {
  const idx = pages.findIndex((p, i) => f >= p.at && f < (pages[i + 1]?.at ?? end));
  if (idx < 0) return null;
  const page = pages[idx];
  const until = pages[idx + 1]?.at ?? end;
  const out = interpolate(f, [until - 4, until], [1, 0], clamp);
  const words = page.text.split(" ");
  const hi = new Set((page.hi ?? []).map((w) => w.toLowerCase()));
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        width: 900,
        top: y,
        transform: "translateY(-50%)",
        textAlign: "center",
        lineHeight: 1.12,
        opacity: out,
      }}
    >
      {words.map((w, i) => {
        const start = page.at + i * step;
        const d = f - start;
        if (d < 0) return null;
        const p = spring({ frame: d, fps: FPS, config: { damping: 11, mass: 0.55, stiffness: 180 } });
        const scale = interpolate(p, [0, 1], [0.55, 1]);
        const newest = d < step * 2 && i === Math.min(words.length - 1, Math.floor((f - page.at) / step));
        const key = hi.has(w.toLowerCase().replace(/[^a-z0-9=]/g, ""));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 14px",
              transform: `scale(${scale * (newest ? 1.08 : 1)})`,
              opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
              fontFamily: FONT.body,
              fontWeight: 800,
              fontSize: size,
              color: key ? COL.yellow : "#ffffff",
              WebkitTextStroke: `11px ${COL.ink}`,
              paintOrder: "stroke fill",
              textShadow: "0 6px 0 rgba(0,0,0,0.25)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Voice-synced captions: render ONCE at the Video level (global frames). Each spoken line from
// voice.ts is a caption page; each word pops in when it is spoken and the word being spoken is
// highlighted. `hi` = words that stay yellow (keywords).
// ---------------------------------------------------------------------------
export type VoiceCue = { text: string; startFrame: number; endFrame: number; words: { w: string; s: number; e: number }[] };

export const VoiceCaptions: React.FC<{ f: number; cues: VoiceCue[]; hi?: string[]; y?: number; size?: number }> = ({
  f,
  cues,
  hi = [],
  y = 1420,
  size = 66,
}) => {
  const idx = cues.findIndex((c, i) => f >= c.startFrame - 2 && f < (cues[i + 1]?.startFrame ?? c.endFrame + 12) - 2);
  if (idx < 0) return null;
  const cue = cues[idx];
  const until = Math.min(cues[idx + 1]?.startFrame ?? cue.endFrame + 12, cue.endFrame + 24);
  const out = interpolate(f, [until - 5, until], [1, 0], clamp);
  const keys = new Set(hi.map((w) => w.toLowerCase()));
  return (
    <div style={{ position: "absolute", left: 90, width: 900, top: y, transform: "translateY(-50%)", textAlign: "center", lineHeight: 1.12, opacity: out }}>
      {cue.words.map((wd, i) => {
        const d = f - wd.s;
        if (d < -1) return null;
        const p = spring({ frame: d + 1, fps: FPS, config: { damping: 11, mass: 0.55, stiffness: 190 } });
        const speaking = f >= wd.s && f < wd.e + 2;
        const key = keys.has(wd.w.toLowerCase().replace(/[^a-z0-9₹%=]/g, ""));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 13px",
              transform: `scale(${interpolate(p, [0, 1], [0.55, 1]) * (speaking ? 1.07 : 1)})`,
              opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
              fontFamily: FONT.body,
              fontWeight: 800,
              fontSize: size,
              color: speaking ? "#7ef0e4" : key ? COL.yellow : "#ffffff",
              WebkitTextStroke: `11px ${COL.ink}`,
              paintOrder: "stroke fill",
              textShadow: "0 6px 0 rgba(0,0,0,0.25)",
            }}
          >
            {wd.w}
          </span>
        );
      })}
    </div>
  );
};
