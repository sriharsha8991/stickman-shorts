import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { COL } from "../stickman/fx";

// ---------------------------------------------------------------------------------------------------------
// Camera, transitions and host staging for LONG-FORM (16:9) videos. Added 2026-10-22 after owner feedback on L001:
// "a transition every 5-7 s, wow effects, Spark always frozen in one spot: bring him closer, vary his size,
// zoom in and out". Rules: LONGFORM.md §7b. Gate: tools/beat_check.py --cut-max 7.
//
//   import { camAt, drift, Transition, sparkAt } from "../shared/camera";
//   const cam = camAt(g, [
//     { f: from, z: 1 },                                   // wide
//     { f: W(3, 2), z: 1.7, at: [300, 520], e: "snap" },  // push in on Spark's face for the aside
//     { f: C(4), z: 1, e: "smooth" },                      // pull back out to reveal
//     { f: W(6, 1), z: 1.35, at: [1300, 500], e: "snap" }, // punch in on the detail
//   ]);
//   <Stage cam={{ ...cam, z: cam.z * drift(g, from) * punch(...) }} ... />
//   <Transition f={g} at={C(8)} kind="slice" />   // in the scene's html, centred on the staging swap
//   const sp = sparkAt(g, [{ f: from, x: 300, s: 1.5 }, { f: W(5, 0), x: 520, s: 2.6 }]); // walks to the camera
//   <SparkHost x={sp.x} s={sp.s} y={sp.y} ... />
// ---------------------------------------------------------------------------------------------------------

const W = 1920; // long-form defaults; Shorts pass size={VERTICAL} / camAt(f, shots, VERTICAL)
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = {
  snap: { dur: 7, e: Easing.bezier(0.2, 0.9, 0.25, 1.08) },
  smooth: { dur: 18, e: Easing.inOut(Easing.cubic) },
  slow: { dur: 45, e: Easing.inOut(Easing.sin) },
  cut: { dur: 0, e: Easing.linear },
};

export type Shot = {
  f: number; // frame the move starts
  z?: number; // zoom (1 = wide). Close-ups 1.4-2.0
  at?: [number, number]; // the point (in 1920x1080 stage coords) to bring to the centre of the frame
  e?: keyof typeof EASE; // snap (7 f) · smooth (18 f) · slow (45 f) · cut (instant)
};

// Camera for <Stage cam>. Interpolates between shots, keeps the frame edges inside the stage.
// `size` = the stage: [1920, 1080] for long-form (default) or VERTICAL ([1080, 1920]) for Shorts.
export const VERTICAL: [number, number] = [1080, 1920];
export const camAt = (f: number, shots: Shot[], size: [number, number] = [1920, 1080]): { x: number; y: number; z: number } => {
  const [W, H] = size;
  const val = (s: Shot) => {
    const z = s.z ?? 1;
    const [px, py] = s.at ?? [W / 2, H / 2];
    const mx = (W / 2) * (1 - 1 / z);
    const my = (H / 2) * (1 - 1 / z);
    return { z, x: Math.max(-mx, Math.min(mx, px - W / 2)), y: Math.max(-my, Math.min(my, py - H / 2)) };
  };
  let cur = { z: 1, x: 0, y: 0 };
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    if (f < s.f) break;
    const { dur, e } = EASE[s.e ?? "smooth"];
    const to = val(s);
    const k = dur === 0 ? 1 : interpolate(f, [s.f, s.f + dur], [0, 1], { ...clamp, easing: e });
    cur = { z: cur.z + (to.z - cur.z) * k, x: cur.x + (to.x - cur.x) * k, y: cur.y + (to.y - cur.y) * k };
  }
  return cur;
};

// Slow push-in so the frame is never frozen between moves (≈ +3% over 6 s, then eases back).
export const drift = (f: number, from = 0, amt = 0.03, period = 360) => 1 + amt * (0.5 - 0.5 * Math.cos(((f - from) / period) * Math.PI * 2));

// ---------------------------------------------------------------------------------------------------------
// Screen transitions (full-frame overlays, ~14 frames, centred on `at`). At the midpoint the frame is fully
// covered, so swap the staging (props, background, Spark's position) exactly on `at`.
//   slice  — 3 diagonal neon bars sweep across
//   whip   — a horizontal motion-blur streak wipes left→right
//   iris   — a circle closes to black on `irisAt` and reopens
//   flash  — white flash with a radial burst (pair it with a camera zoom-through: z 1 → 3 just before `at`)
//   shutter— two panels slam shut and open (vertical)
// Rotate kinds; never the same kind twice in a row.
// ---------------------------------------------------------------------------------------------------------
export type TransitionKind = "slice" | "whip" | "iris" | "flash" | "shutter";

export const Transition: React.FC<{ f: number; at: number; kind: TransitionKind; colors?: string[]; irisAt?: [number, number]; dur?: number; size?: [number, number] }> = ({
  f,
  at,
  kind,
  colors = ["#ff2d55", "#3fe0ff", "#ffd23f"],
  irisAt,
  dur = 14,
  size = [1920, 1080],
}) => {
  const [W, H] = size;
  irisAt = irisAt ?? [W / 2, H / 2];
  const h = dur / 2;
  if (f < at - h || f > at + h) return null;
  const t = (f - (at - h)) / dur; // 0..1, covered at 0.5
  if (kind === "slice") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {colors.map((c, i) => {
          const k = interpolate(t, [0, 0.5, 1], [-1.4, 0, 1.4]) + (i - 1) * 0.08;
          return (
            <div
              key={i}
              style={{ position: "absolute", left: -600, top: -200, width: 3200, height: H + 800, background: c, transform: `translateX(${k * 2200}px) skewX(-24deg)`, clipPath: `inset(${i * 33}% 0 ${(2 - i) * 33}% 0)` }}
            />
          );
        })}
      </AbsoluteFill>
    );
  }
  if (kind === "whip") {
    const x = interpolate(t, [0, 0.5, 1], [-2400, 0, 2400]);
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: x - 400, top: 0, width: 2720, height: H, background: `linear-gradient(90deg, transparent, ${colors[1]} 18%, #0b1030 40%, #0b1030 60%, ${colors[0]} 82%, transparent)`, filter: "blur(18px)" }} />
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: x + ((i * 397) % 1600) - 800, top: 40 + i * (H / 10.4), width: 900, height: 8, background: "#fff", opacity: 0.5, filter: "blur(2px)" }} />
        ))}
      </AbsoluteFill>
    );
  }
  if (kind === "iris") {
    const r = interpolate(t, [0, 0.5, 1], [1300, 0, 1300], { easing: Easing.inOut(Easing.cubic) });
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <svg width={W} height={H}>
          <defs>
            <mask id="irisM">
              <rect width={W} height={H} fill="#fff" />
              <circle cx={irisAt[0]} cy={irisAt[1]} r={Math.max(0, r)} fill="#000" />
            </mask>
          </defs>
          <rect width={W} height={H} fill="#05071a" mask="url(#irisM)" />
          <circle cx={irisAt[0]} cy={irisAt[1]} r={Math.max(0, r)} fill="none" stroke={colors[1]} strokeWidth={14} />
        </svg>
      </AbsoluteFill>
    );
  }
  if (kind === "shutter") {
    const k = interpolate(t, [0, 0.5, 1], [0, 1, 0], { easing: Easing.inOut(Easing.cubic) });
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: (H / 2) * k, background: "#0b1030", borderBottom: `10px solid ${colors[0]}` }} />
        <div style={{ position: "absolute", left: 0, bottom: 0, width: W, height: (H / 2) * k, background: "#0b1030", borderTop: `10px solid ${colors[1]}` }} />
      </AbsoluteFill>
    );
  }
  // flash
  const o = interpolate(t, [0, 0.45, 0.55, 1], [0, 1, 1, 0]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(circle at 50% 50%, #ffffff ${30 + 40 * o}%, ${colors[2]} 100%)`, opacity: o }} />
  );
};

// ---------------------------------------------------------------------------------------------------------
// Host staging: Spark walks, comes close to the camera (bigger, lower) and steps back.
//   s 1.3-1.5 = wide (feet on the ground) · s 2.2-2.8 = medium close-up (knees cut by the frame)
//   s 3.0-3.6 = close-up for asides / whispers / the aha (waist up, bottom-left or bottom-right corner)
// Returns x, s and the hip y so he grows "towards the camera" (feet go below the frame as he gets closer).
// ---------------------------------------------------------------------------------------------------------
export type Place = { f: number; x: number; s: number; e?: keyof typeof EASE };
export const sparkAt = (f: number, keys: Place[], ground = 880): { x: number; s: number; y: number; moving: boolean } => {
  let cur = { x: keys[0].x, s: keys[0].s };
  let moving = false;
  for (const k of keys) {
    if (f < k.f) break;
    const { dur, e } = EASE[k.e ?? "smooth"];
    const p = dur === 0 ? 1 : interpolate(f, [k.f, k.f + dur], [0, 1], { ...clamp, easing: e });
    if (p > 0 && p < 1) moving = true;
    cur = { x: cur.x + (k.x - cur.x) * p, s: cur.s + (k.s - cur.s) * p };
  }
  // feet on the ground when wide; the closer he gets, the lower the feet (the camera is at chest height)
  const feet = ground + Math.max(0, cur.s - 1.5) * 170;
  return { ...cur, y: feet - 92.5 * cur.s, moving };
};

// a thin letterbox that slides in for "cinematic" wow beats (optional)
export const Letterbox: React.FC<{ k: number }> = ({ k }) =>
  k <= 0 ? null : (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 90 * k, background: COL.ink }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, width: W, height: 90 * k, background: COL.ink }} />
    </AbsoluteFill>
  );
