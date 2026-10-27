// Animation-principle helpers for Shorts (added 2026-10-27 after the storytelling/animation review; see
// WRITING.md §I and PIPELINE.md §6). Disney's principles in small functions so every prop moves with weight:
//   anticipate + overshoot (pop with a wind-up), squash & stretch on landings, arcs for thrown things,
//   follow-through wobble after a stop, slow-in/slow-out drops.
import { Easing, interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Scale for an entrance: 3-frame wind-up (0.9), overshoot (1.15), settle (1). Use instead of a plain pop. */
export const popIn = (f: number, at: number) =>
  f < at - 3 ? 0 : interpolate(f, [at - 3, at, at + 5, at + 9, at + 13], [0.0, 0.9, 1.15, 0.97, 1], clamp);

/** Squash & stretch on a landing at `at`: returns [sx, sy] (volume kept). Multiply the prop's scale by them. */
export const squash = (f: number, at: number, amt = 0.25): [number, number] => {
  const d = f - at;
  if (d < -4 || d > 12) return [1, 1];
  const s = d < 0 ? interpolate(d, [-4, 0], [0, -amt * 0.6]) /* stretch while falling */ : amt * Math.exp(-d / 3.5) * Math.cos(d / 2.2);
  return [1 + s, 1 / (1 + s)];
};

/** Position along an arc from a to b with peak height h (thrown props, jumps). t in 0..1. */
export const arc = (t: number, a: [number, number], b: [number, number], h = 200): [number, number] => {
  const k = Math.max(0, Math.min(1, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k - 4 * h * k * (1 - k)];
};

/** Follow-through: a damped wobble (degrees) after something stops at `at`. Use on antennas, tags, signs. */
export const wobble = (f: number, at: number, deg = 10, decay = 8) => {
  const d = f - at;
  return d < 0 || d > decay * 5 ? 0 : deg * Math.exp(-d / decay) * Math.sin(d / 2.4);
};

/** Slow-in/slow-out value between a and b over [f0, f1] (gravity drops use Easing.in(quad) instead). */
export const ease = (f: number, f0: number, f1: number, a: number, b: number) =>
  interpolate(f, [f0, f1], [a, b], { ...clamp, easing: Easing.inOut(Easing.cubic) });

/** Irregular cut rhythm check: given cut frames, returns gaps in seconds (aim: mostly 1.5–3 s, some 0.7 s, a few 4 s). */
export const cutGaps = (cuts: number[], fps = 30) => cuts.slice(1).map((c, i) => +((c - cuts[i]) / fps).toFixed(2));
