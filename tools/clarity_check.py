#!/usr/bin/env python3
"""Clarity gate for a Short's voiceover (owner, 2026-10-29: slow, clean storytelling in simple English).

Reads studio/src/<slug>/voice.txt and voice.ts and checks:
  - overall pace <= 2.3 words/s (whole video, pauses included) and speaking pace <= 3.2 words/s
    (Kokoro af_heart speaks ~3.3 w/s at 1.0x; 0.85x + 0.45 s gaps + pauses brings a Short to ~2.2)
  - every line is a complete sentence: 5–14 words, ends with . ? or !, no fragments like "Same box."
  - at least two [pause] rows of 0.5 s or more (stakes / twist / takeaway)
  - gaps between lines average >= 0.35 s
  - no idioms / jargon from the blocklist, few long words (13+ letters)
Prints PASS or FAIL with the reasons. Usage: python3 tools/clarity_check.py --slug v104-wobbly-shelf
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOCK = [
    "do the math", "the flinch", "game changer", "hack your", "dopamine hit", "in a nutshell", "bottom line",
    "cognitive", "heuristic", "paradigm", "leverage", "utility", "salience", "anchoring", "loss aversion",
    "mechanism", "stimulus", "valuation", "bias", "nudge",
]
EXPLAINED_OK = re.compile(r"(means|that is|in other words|in simple words|called)", re.I)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    a = ap.parse_args()
    d = ROOT / "studio" / "src" / a.slug
    rows = [r.strip() for r in (d / "voice.txt").read_text().splitlines() if r.strip()]
    ts = (d / "voice.ts").read_text()
    frames = int(re.search(r"VOICE_FRAMES = (\d+)", ts).group(1))
    cues = json.loads(re.search(r"VOICE_CUES: VCue\[\] = (\[.*\]);", ts).group(1))
    fps = 30
    problems = []

    lines = [r for r in rows if not r.startswith("[pause")]
    pauses = [float(m.group(1)) for r in rows for m in [re.match(r"\[pause ([\d.]+)\]", r)] if m]
    words = sum(len(l.split()) for l in lines)
    total_s = frames / fps
    speak_s = sum((c["endFrame"] - c["startFrame"]) / fps for c in cues)
    pace = words / total_s
    speak = words / max(speak_s, 0.1)
    gaps = [(cues[i + 1]["startFrame"] - cues[i]["endFrame"]) / fps for i in range(len(cues) - 1)]
    avg_gap = sum(gaps) / max(len(gaps), 1)

    if pace > 2.3:
        problems.append(f"overall pace {pace:.2f} words/s > 2.3 (slow down: fewer words, longer pauses)")
    if speak > 3.2:
        problems.append(f"speaking pace {speak:.2f} words/s > 3.2 (voice speed 0.85 from voice.json, fewer and simpler words)")
    if len([p for p in pauses if p >= 0.5]) < 2:
        problems.append("fewer than two [pause 0.5+] rows (add pauses after the stakes, before the twist and the takeaway)")
    if avg_gap < 0.35:
        problems.append(f"average gap between lines {avg_gap:.2f} s < 0.35 (run voiceover.py with --gap 0.45)")
    for l in lines:
        n = len(l.split())
        if n < 5:
            problems.append(f"fragment / too short ({n} words): {l!r}")
        if n > 14:
            problems.append(f"too long ({n} words), split it: {l!r}")
        if not re.search(r"[.?!]['\"]?$", l):
            problems.append(f"not a complete sentence (no . ? !): {l!r}")
        low = l.lower()
        for b in BLOCK:
            if b in low and not EXPLAINED_OK.search(l):
                problems.append(f"hard word / idiom {b!r} (use plain words or explain it): {l!r}")
        longw = [w for w in re.findall(r"[A-Za-z'-]+", l) if len(w) >= 13]
        if longw:
            problems.append(f"long word(s) {longw} (prefer simpler words): {l!r}")

    print(f"{a.slug}: {words} words · {total_s:.1f} s · overall {pace:.2f} w/s · speaking {speak:.2f} w/s · "
          f"avg gap {avg_gap:.2f} s · pauses {pauses}")
    if problems:
        print("FAIL")
        for p in problems:
            print("  -", p)
        sys.exit(1)
    print("PASS")


if __name__ == "__main__":
    main()
