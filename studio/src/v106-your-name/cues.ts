import { TIMELINE } from "./timeline";

// Anchor everything to cue INDICES, never to fixed seconds: when the recorded voice is
// aligned (align_voice.py) the cue times change and every anchored scene/beat follows.

// global frame where cue i starts (use it for SCENES[].from)
export const cueStart = (i: number) => TIMELINE.cues[Math.min(i, TIMELINE.cues.length - 1)]?.startFrame ?? 0;

// global frame where cue i ends
export const cueEnd = (i: number) => TIMELINE.cues[Math.min(i, TIMELINE.cues.length - 1)]?.endFrame ?? 0;

// local frame (inside a scene starting at `from`) of a point inside cue i:
// frac 0 = when the line starts, 0.5 = halfway through it, 1 = when it ends
export const beat = (from: number, i: number, frac = 0) => {
  const a = cueStart(i);
  return Math.round(a + (cueEnd(i) - a) * frac) - from;
};

// length in frames of cue i (to stretch an action over a spoken line)
export const cueLen = (i: number) => cueEnd(i) - cueStart(i);
