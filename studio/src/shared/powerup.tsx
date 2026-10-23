import React from "react";
import { interpolate, random } from "remotion";
import { COL, FONT } from "../stickman/fx";
import { BULB_ON, SPARK_COLOR } from "./mascot";

// ---------------------------------------------------------------------------
// POWER-UP HOOK FX (added 2026-10-23, owner asked for anime-fight energy at the hooks).
// Generic shonen-anime visual language — energy aura, charge-up rumble, focus lines, impact frames,
// shockwaves, an energy beam, a dash with afterimages, two auras clashing, a power gauge that breaks.
// Guardrail (PIPELINE §9): these are GENERIC effects. Never copy a specific show's characters, hair,
// costumes, named attacks, catchphrases, sound effects or its "power level" meme. Spark keeps his
// own look (mascot.tsx); the aura is HIS colour (teal) or the bulb's gold.
//
// Use ONE kind per Short, inside the cold open (0–2.5 s), optionally echoed once at the re-hook
// (~14 s). Rotate kinds across videos so no two consecutive Shorts open the same way.
// The hook text stays readable: no effect may sit over the title zone (y 260–620) for more than 4 frames.
//
//   import { PowerUp, powerHits } from "../shared/powerup";
//   <Stage hits={powerHits("charge", 0)} svg={<>
//       <PowerUp kind="charge" f={f} at={0} x={540} y={1100} />   // behind Spark
//       <Spark …/>
//       <PowerUp kind="charge" f={f} at={0} x={540} y={1100} layer="front" />
//   </>} />
// Reference composition: PowerUpDemo (node stickman-sheet.mjs PowerUpDemo out/powerup.png 0-470:16)
// ---------------------------------------------------------------------------

export type PowerKind = "charge" | "impact" | "beam" | "dash" | "clash" | "meter";
export const POWER_KINDS: PowerKind[] = ["charge", "impact", "beam", "dash", "clash", "meter"];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const env = (f: number, at: number, inn: number, hold: number, out: number) =>
  interpolate(f, [at, at + inn, at + inn + hold, at + inn + hold + out], [0, 1, 1, 0], clamp);

// ---------- building blocks -------------------------------------------------

/** Flickering flame aura around a figure. (x, y) = feet centre; h = figure height in px. */
export const Aura: React.FC<{ f: number; x: number; y: number; h?: number; k: number; color?: string; core?: string; seed?: string }> = ({
  f,
  x,
  y,
  h = 420,
  k,
  color = SPARK_COLOR,
  core = "#ffffff",
  seed = "a",
}) => {
  if (k <= 0.01) return null;
  const w = h * 0.5;
  const layer = (scale: number, fill: string, op: number, phase: number) => {
    const n = 22;
    const pts: string[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n; // 0..1 across the outline (left foot → top → right foot)
      const a = Math.PI * (1 - t); // half ellipse
      const spike = i % 2 === 0 ? 1 : 0.72;
      const flick = 0.85 + 0.3 * random(`${seed}${phase}${i}-${Math.floor(f / 2)}`);
      const rx = w * scale * spike * flick;
      const ry = h * 0.78 * scale * spike * flick * (0.9 + 0.25 * Math.sin(a));
      pts.push(`${x + Math.cos(a) * rx},${y - h * 0.08 - Math.sin(a) * ry - (spike === 1 && Math.sin(a) > 0.6 ? h * 0.18 * scale * flick : 0)}`);
    }
    return <polygon points={pts.join(" ")} fill={fill} opacity={op * k} strokeLinejoin="round" />;
  };
  return (
    <g>
      {layer(1.35, color, 0.28, 0)}
      {layer(1.1, color, 0.45, 1)}
      {layer(0.85, core, 0.35, 2)}
      {/* rising sparks */}
      {Array.from({ length: 14 }, (_, i) => {
        const life = 18;
        const t = ((f + i * 7) % life) / life;
        const sx = x + (random(`${seed}sx${i}`) - 0.5) * w * 2.2;
        const sy = y - t * h * 1.3;
        return <circle key={i} cx={sx} cy={sy} r={5 * (1 - t) + 2} fill={i % 3 === 0 ? BULB_ON : core} opacity={k * (1 - t)} />;
      })}
    </g>
  );
};

/** Focus lines: radial streaks converging on (x, y). Classic "dramatic stare" / impact lines. */
export const FocusLines: React.FC<{ f: number; x: number; y: number; k: number; color?: string; inner?: number; count?: number; W?: number; H?: number }> = ({
  f,
  x,
  y,
  k,
  color = COL.ink,
  inner = 260,
  count = 46,
  W = 1080,
  H = 1920,
}) => {
  if (k <= 0.01) return null;
  const R = Math.hypot(W, H);
  return (
    <g opacity={k}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + (random(`fl${i}`) - 0.5) * 0.12;
        const jit = random(`fl${i}-${Math.floor(f / 2)}`);
        const r0 = inner * (0.9 + jit * 0.5);
        const wd = 6 + random(`flw${i}`) * 16;
        const a1 = a - wd / R / 2;
        const a2 = a + wd / R / 2;
        return (
          <polygon
            key={i}
            points={`${x + Math.cos(a) * r0},${y + Math.sin(a) * r0} ${x + Math.cos(a1) * R},${y + Math.sin(a1) * R} ${x + Math.cos(a2) * R},${y + Math.sin(a2) * R}`}
            fill={color}
          />
        );
      })}
    </g>
  );
};

/** Two-frame impact flash: white, then an inverted dark frame with white focus lines. Use on the slam frame. */
export const ImpactFrame: React.FC<{ f: number; at: number; x?: number; y?: number; W?: number; H?: number }> = ({ f, at, x = 540, y = 900, W = 1080, H = 1920 }) => {
  const d = f - at;
  if (d < 0 || d > 3) return null;
  if (d <= 1) return <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#ffffff" opacity={d === 0 ? 0.95 : 0.7} />;
  return (
    <g>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={COL.ink} opacity={0.82} />
      <FocusLines f={f} x={x} y={y} k={1} color="#ffffff" inner={180} count={36} W={W} H={H} />
    </g>
  );
};

/** Expanding ground ring + dust puffs at (x, ground). */
export const Shockwave: React.FC<{ f: number; at: number; x: number; ground: number; color?: string; size?: number }> = ({ f, at, x, ground, color = "#ffffff", size = 1 }) => {
  const d = f - at;
  if (d < 0 || d > 22) return null;
  const t = d / 22;
  const rx = (120 + 520 * (1 - (1 - t) ** 3)) * size;
  return (
    <g opacity={1 - t}>
      <ellipse cx={x} cy={ground} rx={rx} ry={rx * 0.16} fill="none" stroke={color} strokeWidth={14 * (1 - t) + 3} />
      <ellipse cx={x} cy={ground} rx={rx * 0.7} ry={rx * 0.11} fill="none" stroke={BULB_ON} strokeWidth={6 * (1 - t) + 2} />
      {Array.from({ length: 10 }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const px = x + side * rx * (0.55 + random(`sw${i}`) * 0.45);
        return <circle key={i} cx={px} cy={ground - 18 - t * 60 * random(`swy${i}`)} r={(18 + 22 * random(`swr${i}`)) * (1 - t * 0.5) * size} fill="#d9d4c7" opacity={0.85} />;
      })}
    </g>
  );
};

/** Rocks lifting off the ground while charging. */
export const Debris: React.FC<{ f: number; at: number; x: number; ground: number; k: number; spread?: number }> = ({ f, at, x, ground, k, spread = 360 }) => {
  if (k <= 0.01) return null;
  const d = Math.max(0, f - at);
  return (
    <g opacity={k}>
      {Array.from({ length: 12 }, (_, i) => {
        const px = x + (random(`db${i}`) - 0.5) * spread * 2;
        const rise = Math.min(1, d / (20 + random(`dbt${i}`) * 25)) * (60 + random(`dbh${i}`) * 220);
        const bob = Math.sin((f + i * 9) / 6) * 6;
        const s = 10 + random(`dbs${i}`) * 22;
        const rot = (f * (random(`dbr${i}`) - 0.5) * 6) % 360;
        return (
          <polygon
            key={i}
            transform={`translate(${px} ${ground - rise + bob}) rotate(${rot})`}
            points={`${-s},${-s * 0.4} ${-s * 0.2},${-s} ${s},${-s * 0.5} ${s * 0.7},${s * 0.6} ${-s * 0.6},${s * 0.7}`}
            fill="#6d655a"
            stroke={COL.ink}
            strokeWidth={3}
          />
        );
      })}
    </g>
  );
};

/** Energy beam from (x1,y1) to (x2,y2): grows in over `grow` frames, crackles, bursts at the tip. */
export const Beam: React.FC<{ f: number; at: number; x1: number; y1: number; x2: number; y2: number; grow?: number; hold?: number; color?: string }> = ({
  f,
  at,
  x1,
  y1,
  x2,
  y2,
  grow = 8,
  hold = 26,
  color = SPARK_COLOR,
}) => {
  const d = f - at;
  if (d < 0 || d > grow + hold + 8) return null;
  const reach = interpolate(d, [0, grow], [0, 1], clamp);
  const fade = interpolate(d, [grow + hold, grow + hold + 8], [1, 0], clamp);
  const tx = x1 + (x2 - x1) * reach;
  const ty = y1 + (y2 - y1) * reach;
  const w = 70 + 12 * Math.sin(f * 1.7);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const len = Math.hypot(tx - x1, ty - y1);
  return (
    <g opacity={fade}>
      <g transform={`translate(${x1} ${y1}) rotate(${ang})`}>
        <rect x={0} y={-w * 0.75} width={len} height={w * 1.5} rx={w * 0.75} fill={color} opacity={0.35} />
        <rect x={0} y={-w * 0.45} width={len} height={w * 0.9} rx={w * 0.45} fill={color} opacity={0.85} />
        <rect x={0} y={-w * 0.18} width={len} height={w * 0.36} rx={w * 0.18} fill="#ffffff" />
        {Array.from({ length: 6 }, (_, i) => {
          const ox = ((f * 38 + i * 140) % Math.max(1, len));
          return <line key={i} x1={ox} y1={(random(`bm${i}-${f}`) - 0.5) * w * 1.4} x2={ox + 90} y2={(random(`bm2${i}-${f}`) - 0.5) * w * 1.4} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" />;
        })}
      </g>
      {/* hand glow + tip burst */}
      <circle cx={x1} cy={y1} r={w * 0.9} fill="#ffffff" opacity={0.9} />
      <circle cx={x1} cy={y1} r={w * 1.3} fill={color} opacity={0.35} />
      {reach >= 1 && (
        <g>
          <circle cx={x2} cy={y2} r={w * (1.6 + 0.2 * Math.sin(f))} fill={color} opacity={0.4} />
          <circle cx={x2} cy={y2} r={w * 1.0} fill="#ffffff" opacity={0.95} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2 + f * 0.3;
            return <line key={i} x1={x2 + Math.cos(a) * w} y1={y2 + Math.sin(a) * w} x2={x2 + Math.cos(a) * w * 2.4} y2={y2 + Math.sin(a) * w * 2.4} stroke={BULB_ON} strokeWidth={8} strokeLinecap="round" />;
          })}
        </g>
      )}
    </g>
  );
};

/** Speed streaks behind a fast horizontal dash (use with <Spark trails />). dir = +1 moving right. */
export const DashStreaks: React.FC<{ f: number; at: number; x: number; y: number; dir?: number; dur?: number; h?: number }> = ({ f, at, x, y, dir = 1, dur = 8, h = 380 }) => {
  const d = f - at;
  if (d < 0 || d > dur + 6) return null;
  const k = interpolate(d, [0, 2, dur, dur + 6], [0, 1, 1, 0], clamp);
  return (
    <g opacity={k}>
      {Array.from({ length: 12 }, (_, i) => {
        const yy = y - random(`ds${i}`) * h;
        const L = 160 + random(`dsl${i}`) * 320;
        return <line key={i} x1={x - dir * 40} y1={yy} x2={x - dir * (40 + L)} y2={yy} stroke={i % 3 ? COL.ink : SPARK_COLOR} strokeWidth={4 + random(`dsw${i}`) * 6} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Clash: two auras meet at (x, y); a white spark star + lightning at the contact point. */
export const ClashSpark: React.FC<{ f: number; x: number; y: number; k: number }> = ({ f, x, y, k }) => {
  if (k <= 0.01) return null;
  const s = 1 + 0.25 * Math.sin(f * 1.3);
  const star = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = (i % 2 ? 50 : 150 + 40 * random(`cs${i}-${Math.floor(f / 2)}`)) * s;
    return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
  }).join(" ");
  const bolt = (i: number) => {
    let px = x;
    let py = y;
    const a = (i / 5) * Math.PI * 2 + random(`cb${i}-${Math.floor(f / 3)}`);
    const pts = [`${px},${py}`];
    for (let j = 0; j < 5; j++) {
      px += Math.cos(a) * 45 + (random(`cb${i}${j}-${f}`) - 0.5) * 50;
      py += Math.sin(a) * 45 + (random(`cbb${i}${j}-${f}`) - 0.5) * 50;
      pts.push(`${px},${py}`);
    }
    return <polyline key={i} points={pts.join(" ")} fill="none" stroke={BULB_ON} strokeWidth={6} strokeLinejoin="round" />;
  };
  return (
    <g opacity={k}>
      <polygon points={star} fill="#ffffff" stroke={BULB_ON} strokeWidth={6} />
      {Array.from({ length: 5 }, (_, i) => bolt(i))}
    </g>
  );
};

/** Power gauge that fills, overloads and cracks. value 0..1+ (above 1 = overload). */
export const PowerGauge: React.FC<{ f: number; x: number; y: number; value: number; label?: string; w?: number; crackAt?: number }> = ({
  f,
  x,
  y,
  value,
  label = "POWER",
  w = 640,
  crackAt,
}) => {
  const fill = Math.min(1, Math.max(0, value));
  const over = value > 1;
  const cracked = crackAt !== undefined && f >= crackAt;
  const shake = over && !cracked ? (random(`pg${f}`) - 0.5) * 10 : 0;
  const hue = over ? COL.red : fill > 0.7 ? COL.orange : SPARK_COLOR;
  return (
    <g transform={`translate(${x - w / 2 + shake} ${y})`}>
      <text x={0} y={-22} fontFamily={FONT.comic} fontSize={54} fill={COL.ink}>
        {label}
      </text>
      <rect x={0} y={0} width={w} height={70} rx={14} fill="#ffffff" stroke={COL.ink} strokeWidth={7} />
      <rect x={8} y={8} width={(w - 16) * fill} height={54} rx={9} fill={hue} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={(w / 10) * (i + 1)} y1={8} x2={(w / 10) * (i + 1)} y2={62} stroke={COL.ink} strokeWidth={3} opacity={0.35} />
      ))}
      {cracked && (
        <g>
          <polyline points={`${w * 0.55},-10 ${w * 0.5},25 ${w * 0.6},40 ${w * 0.52},85`} fill="none" stroke={COL.ink} strokeWidth={7} />
          <polyline points={`${w * 0.5},25 ${w * 0.4},32`} fill="none" stroke={COL.ink} strokeWidth={5} />
          {Array.from({ length: 8 }, (_, i) => {
            const d = f - crackAt!;
            const a = -Math.PI / 2 + (random(`pgs${i}`) - 0.5) * 2.4;
            const v = 14 + random(`pgv${i}`) * 10;
            return <rect key={i} x={w * 0.55 + Math.cos(a) * v * d} y={30 + Math.sin(a) * v * d + 1.2 * d * d} width={18} height={12} fill={hue} stroke={COL.ink} strokeWidth={3} transform={`rotate(${d * 25 * (i % 2 ? 1 : -1)} ${w * 0.55} 30)`} opacity={Math.max(0, 1 - d / 20)} />;
          })}
        </g>
      )}
    </g>
  );
};

// ---------- presets ---------------------------------------------------------

/** Camera-shake hit frames for a preset, to pass to <Stage hits={…}>. */
export const powerHits = (kind: PowerKind, at: number): number[] => {
  switch (kind) {
    case "charge":
      return [at + 4, at + 10, at + 16, at + 22, at + 28]; // rumble, then the burst at at+28
    case "impact":
      return [at + 12];
    case "beam":
      return [at + 14, at + 22];
    case "dash":
      return [at + 8];
    case "clash":
      return [at + 10, at + 16, at + 22];
    case "meter":
      return [at + 34];
  }
};

/** Frame (relative to `at`) where the preset's big moment lands: put the hook word / slam here. */
export const POWER_PEAK: Record<PowerKind, number> = { charge: 28, impact: 12, beam: 14, dash: 8, clash: 10, meter: 34 };

/**
 * One-line preset for a cold open. Draw it twice inside the Stage svg: layer="back" before Spark,
 * layer="front" after him. Coordinates in the 1080×1920 frame:
 *   x,y     = Spark's feet (ground point)        tx,ty = target (beam end, impact point, clash point)
 *   h       = Spark's height in px (≈ 185 × scale)  dir = dash direction
 */
export const PowerUp: React.FC<{
  kind: PowerKind;
  f: number;
  at: number;
  x: number;
  y: number;
  h?: number;
  tx?: number;
  ty?: number;
  dir?: number;
  layer?: "back" | "front";
  color?: string;
  rival?: string; // clash: the other side's colour
  gauge?: { label?: string; value: number };
}> = ({ kind, f, at, x, y, h = 360, tx = 540, ty = 700, dir = 1, layer = "back", color = SPARK_COLOR, rival = COL.red, gauge }) => {
  const d = f - at;
  if (d < -2 || d > 75) return null;
  const peak = POWER_PEAK[kind];
  const back = layer === "back";
  switch (kind) {
    case "charge": {
      const build = interpolate(d, [0, peak], [0.3, 1], clamp) * env(f, at, 4, peak + 14, 18);
      return back ? (
        <g>
          <FocusLines f={f} x={x} y={y - h * 0.55} k={interpolate(d, [0, 6, peak, peak + 12], [0, 0.18, 0.28, 0], clamp)} inner={h * 0.9} />
          <Aura f={f} x={x} y={y} h={h} k={build} color={color} />
          <Debris f={f} at={at} x={x} ground={y} k={env(f, at, 6, peak, 14)} />
        </g>
      ) : (
        <g>
          <Shockwave f={f} at={at + peak} x={x} ground={y} />
          <ImpactFrame f={f} at={at + peak} x={x} y={y - h * 0.5} />
        </g>
      );
    }
    case "impact":
      return back ? (
        <FocusLines f={f} x={tx} y={ty} k={interpolate(d, [0, 4, peak + 10, peak + 24], [0, 0.35, 0.35, 0], clamp)} inner={240} />
      ) : (
        <g>
          <Shockwave f={f} at={at + peak} x={tx} ground={ty + 120} size={0.8} />
          <ImpactFrame f={f} at={at + peak} x={tx} y={ty} />
        </g>
      );
    case "beam": {
      const k = env(f, at, 4, peak + 26, 10);
      return back ? (
        <Aura f={f} x={x} y={y} h={h} k={k * 0.8} color={color} />
      ) : (
        <g>
          <Beam f={f} at={at + peak - 8} x1={x + dir * h * 0.32} y1={y - h * 0.62} x2={tx} y2={ty} color={color} />
          <ImpactFrame f={f} at={at + peak} x={tx} y={ty} />
        </g>
      );
    }
    case "dash":
      return back ? (
        <DashStreaks f={f} at={at} x={x} y={y - 20} dir={dir} h={h} />
      ) : (
        <g>
          <Shockwave f={f} at={at + peak} x={x} ground={y} size={0.6} />
          <FocusLines f={f} x={x} y={y - h * 0.5} k={interpolate(d, [peak, peak + 2, peak + 14, peak + 24], [0, 0.3, 0.3, 0], clamp)} inner={h * 0.8} />
        </g>
      );
    case "clash": {
      const k = env(f, at, 6, 30, 14);
      return back ? (
        <g>
          <Aura f={f} x={x} y={y} h={h} k={k} color={color} seed="L" />
          <Aura f={f} x={tx} y={y} h={h} k={k} color={rival} seed="R" />
        </g>
      ) : (
        <ClashSpark f={f} x={(x + tx) / 2} y={y - h * 0.55} k={interpolate(d, [peak - 2, peak, peak + 26, peak + 36], [0, 1, 1, 0], clamp)} />
      );
    }
    case "meter": {
      if (!back) return <ImpactFrame f={f} at={at + peak} x={tx} y={ty} />;
      const v = gauge?.value ?? interpolate(d, [0, peak - 6, peak], [0, 1, 1.15], clamp);
      return (
        <g>
          <Aura f={f} x={x} y={y} h={h} k={interpolate(d, [0, peak, peak + 20, peak + 30], [0.2, 1, 1, 0], clamp)} color={color} />
          {d < peak + 24 && <PowerGauge f={f} x={tx} y={ty} value={v} label={gauge?.label} crackAt={at + peak} />}
        </g>
      );
    }
  }
};
