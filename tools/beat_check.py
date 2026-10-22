#!/usr/bin/env python3
"""Retention gate for long-form renders: find stretches where the picture barely changes.

Samples the video every 0.5 s (small greyscale frames), measures how much each sample differs from the
previous one, and reports every window longer than --max seconds with no visible change (a new element,
text callout, camera punch or cut). Captions alone don't count much, so the caption band is masked out.

  python3 tools/beat_check.py studio/out/L001-x.mp4 [--max 5] [--thresh 1.5] [--mask-bottom 0.16] [--cut-max 7]

Two gates (owner, 2026-10-22):
  1. beats: no stretch > --max s without a visible change (mean abs diff >= --thresh)
  2. transitions: no stretch > --cut-max s without a SCREEN TRANSITION, i.e. a big change of the whole picture
     (mean abs diff >= --cut-thresh: a whip/slice/zoom-through/iris wipe, a camera zoom in or out, a new
     staging). Calibrated on L001: its chapter cards and scene swaps score 10-40, a text pop scores 1.5-5.
     --cut-max 0 disables gate 2. The first and last 3 s are not checked for transitions.

Exit code 1 if either gate fails (fix the scene: add a beat, callout, punch-in, transition or camera move).
"""
import argparse
import json
import subprocess
import sys

import numpy as np


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--max", type=float, default=5.0, help="longest allowed stretch without a visual change (s)")
    ap.add_argument("--thresh", type=float, default=1.5, help="mean abs pixel change (0-255) that counts as a change")
    ap.add_argument("--mask-bottom", type=float, default=0.16, help="fraction of the frame height (caption band) to ignore")
    ap.add_argument("--cut-max", type=float, default=7.0, help="longest allowed stretch without a screen transition (s); 0 = off")
    ap.add_argument("--cut-thresh", type=float, default=8.0, help="mean abs pixel change that counts as a screen transition")
    a = ap.parse_args()
    W, H, step = 192, 108, 0.5
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"fps={1/step},scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
        capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
    keep = int(H * (1 - a.mask_bottom))
    fr = fr[:, :keep, :]
    diffs = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
    changed = diffs >= a.thresh
    dead, start = [], 0.0
    for i, c in enumerate(changed):
        t = (i + 1) * step
        if c:
            if t - start > a.max:
                dead.append((round(start, 1), round(t, 1)))
            start = t
    end = len(fr) * step
    if end - start > a.max:
        dead.append((round(start, 1), round(end, 1)))
    gaps = np.diff([0.0] + [(i + 1) * step for i, c in enumerate(changed) if c] + [end])
    slow = []
    cut_times = [(i + 1) * step for i, d in enumerate(diffs) if d >= a.cut_thresh]
    if a.cut_max > 0:
        marks = [3.0] + [t for t in cut_times if 3.0 < t < end - 3.0] + [end - 3.0]
        slow = [(round(x, 1), round(y, 1)) for x, y in zip(marks, marks[1:]) if y - x > a.cut_max]
    cgaps = np.diff([0.0] + cut_times + [end])
    print(json.dumps({"duration_s": end, "changes": int(changed.sum()), "median_gap_s": float(np.median(gaps)) if len(gaps) else None,
                      "dead_stretches": dead, "transitions": len(cut_times),
                      "median_transition_gap_s": float(np.median(cgaps)) if len(cgaps) else None,
                      "slow_transition_stretches": slow}, indent=1))
    sys.exit(1 if dead or slow else 0)


if __name__ == "__main__":
    main()
