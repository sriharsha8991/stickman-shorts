#!/usr/bin/env python3
"""Retention gate for long-form renders: find stretches where the picture barely changes.

Samples the video every 0.5 s (small greyscale frames), measures how much each sample differs from the
previous one, and reports every window longer than --max seconds with no visible change (a new element,
text callout, camera punch or cut). Captions alone don't count much, so the caption band is masked out.

  python3 tools/beat_check.py studio/out/L001-x.mp4 [--max 5] [--thresh 1.5] [--mask-bottom 0.16]

Exit code 1 if any dead stretch is found (fix the scene: add a beat, callout, punch-in or cut).
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
    print(json.dumps({"duration_s": end, "changes": int(changed.sum()), "median_gap_s": float(np.median(gaps)) if len(gaps) else None,
                      "dead_stretches": dead}, indent=1))
    sys.exit(1 if dead else 0)


if __name__ == "__main__":
    main()
