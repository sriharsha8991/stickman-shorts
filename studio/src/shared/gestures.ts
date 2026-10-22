// Spark's gesture library (added 2026-10-22: the owner asked for more gestures and expressions).
// Pose presets (arm angles in the engine's convention: ra1/la1 ≈ 0 down, ±95 horizontal, ±160 up; la* is the
// mirrored left arm) and helpers that turn a list of beats into keys with anticipation and holds, so
// gestures SNAP on the spoken word instead of drifting. Works for Spark and for plain engine figures.
//
//   import { G, gestureKeys, wave, hop, nod } from "../shared/gestures";
//   const keys = gestureKeys([
//     [0, G.present], [W(0, 3), G.pointUp, "snap"], [W(1, 0), G.thinkChin], [W(2, 4), G.mindBlown, "snap"],
//   ]);
//   <Spark keys={keys} mod={(t, p) => addPose(addPose(p, idle(t, 8)), wave(t, W(0,0), 30))} mood={...} />
//
// Rules of thumb (animation-principles skill): hold a pose 8–20 frames, change it on a spoken word, add a
// 3–5 frame anticipation in the opposite direction before big moves, and pair every gesture with a mood.

import { SNAP, type Key, type Pose } from "../stickman/stick";

type P = Partial<Pose>;

export const G = {
  rest: { ra1: 12, ra2: 6, la1: -12, la2: -6 } as P,
  present: { ra1: 60, ra2: 40, la1: -20, la2: 10, head: -4 } as P, // open palm towards the content
  presentBoth: { ra1: 60, ra2: 40, la1: -60, la2: -40, head: -3 } as P,
  pointUp: { ra1: 165, ra2: -5, la1: -18, la2: 10, head: -8 } as P, // "here's the thing"
  pointSide: { ra1: 95, ra2: 0, la1: -15, la2: 10 } as P,
  pointDown: { ra1: 40, ra2: 10, la1: -10, la2: 0, head: 12, lean: 6 } as P,
  doublePoint: { ra1: 100, ra2: -6, la1: 70, la2: 30, lean: 6 } as P, // both hands at the same thing
  thinkChin: { ra1: 30, ra2: 145, la1: 25, la2: 80, head: 10 } as P,
  handsHips: { ra1: 60, ra2: -80, la1: -60, la2: 80 } as P, // confident / "seriously?"
  armsCrossed: { ra1: 35, ra2: -125, la1: -35, la2: 125, head: 4 } as P, // skeptical
  shrugBig: { la1: -70, la2: -110, ra1: 70, ra2: 110, head: 12, lean: -3 } as P,
  facepalm: { ra1: 160, ra2: 120, head: 20, lean: 5 } as P,
  mindBlown: { ra1: 150, ra2: 95, la1: -150, la2: -95, head: -6, lean: -4 } as P, // hands at temples
  celebrate: { la1: -155, la2: -25, ra1: 155, ra2: 25, head: -8 } as P,
  fistPump: { ra1: 120, ra2: 50, la1: -20, la2: 10, lean: -4 } as P,
  stop: { ra1: 90, ra2: 75, la1: -12, la2: -6, lean: -6 } as P, // palm out: "wait"
  beckon: { ra1: 80, ra2: 80, la1: -15, la2: 10, lean: 5 } as P, // "come closer"
  whisper: { ra1: 30, ra2: 135, la1: -20, la2: 10, lean: 14, head: 14 } as P, // lean in, hand by mouth
  leanIn: { lean: 12, head: 8, ra1: 50, ra2: -20, la1: -30, la2: 10 } as P,
  recoil: { lean: -16, head: -12, ra1: 60, ra2: -60, la1: -60, la2: 60 } as P, // surprised step back
  count1: { ra1: 150, ra2: 20, la1: -15, la2: 10 } as P, // with a "1" callout
  count2: { ra1: 140, ra2: 30, la1: -140, la2: -30 } as P, // with a "2" callout
  wave1: { ra1: 150, ra2: 30, la1: -12 } as P,
  wave2: { ra1: 150, ra2: -30, la1: -12 } as P,
  clap1: { ra1: 50, ra2: -140, la1: -50, la2: 140 } as P,
  clap2: { ra1: 55, ra2: -115, la1: -55, la2: 115 } as P,
};

export type GestureName = keyof typeof G;
export type Beat = [frame: number, pose: P, style?: "snap" | "smooth"];

// Build keys from beats: each new pose is held until 4 frames before the next beat (so it doesn't drift),
// "snap" beats get a 3-frame anticipation (slight opposite lean) and SNAP easing.
export const gestureKeys = (beats: Beat[]): Key[] => {
  const keys: Key[] = [];
  beats.forEach(([f, p, style], i) => {
    const prev = beats[i - 1];
    if (prev) keys.push({ f: Math.max(prev[0] + 1, f - 4), p: prev[1] });
    if (style === "snap" && prev) keys.push({ f: f - 2, p: { ...prev[1], lean: (prev[1].lean ?? 0) - 6 } });
    keys.push(style === "snap" ? { f: f + 2, p, e: SNAP } : { f: f + 6, p });
  });
  return keys;
};

const add = (a: Partial<Pose>): Partial<Pose> => a;

// Additive layers for `mod` (combine with addPose): a wave, a hop, a nod and a shake.
export const wave = (t: number, at: number, dur = 30): Partial<Pose> => {
  if (t < at || t > at + dur) return add({});
  return add({ ra2: Math.sin(((t - at) / 6) * Math.PI) * 35 });
};
export const hop = (t: number, at: number, h = 40): Partial<Pose> => {
  const k = (t - at) / 12;
  if (k < 0 || k > 1) return add({});
  return add({ y: -Math.sin(k * Math.PI) * h });
};
export const nod = (t: number, at: number, n = 2): Partial<Pose> => {
  const k = (t - at) / (8 * n);
  if (k < 0 || k > 1) return add({});
  return add({ head: Math.sin(k * n * Math.PI * 2) * 10 });
};
export const shake = (t: number, at: number, n = 3): Partial<Pose> => {
  const k = (t - at) / (6 * n);
  if (k < 0 || k > 1) return add({});
  return add({ lean: Math.sin(k * n * Math.PI * 2) * 5 });
};
