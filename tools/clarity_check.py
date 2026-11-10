#!/usr/bin/env python3
"""Clarity gate for a Short's voiceover (owner, 2026-10-29: slow, clean storytelling in simple English).

Reads studio/src/<slug>/voice.txt and voice.ts and checks:
  - overall pace <= 2.3 words/s (whole video, pauses included) and speaking pace <= 3.2 words/s
    (Kokoro af_heart speaks ~3.3 w/s at 1.0x; 0.85x + 0.45 s gaps + pauses brings a Short to ~2.2)
  - every line is a complete sentence: 5–14 words, ends with . ? or !, no fragments like "Same box."
  - at least two [pause] rows of 0.5 s or more (stakes / twist / takeaway)
  - gaps between lines average >= 0.35 s
  - no idioms / jargon from the blocklist, few long words (13+ letters)
  - length (owner, 2026-11-01): ~30 s is the sweet spot, 40 s is the cap, 45 s the absolute threshold.
    > 40 s FAILS unless --allow-long (only after two honest rewrites; still FAILS above 45 s).
  - promise-to-the-end (owner, 2026-11-01): one of the first three spoken lines tells the viewer there is
    something at the end ("Wait for the last part.", "At the end, you will see…", "Stay until the end.").
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
    ap.add_argument("--allow-long", action="store_true", help="accept 40-45 s (explain why in the email)")
    ap.add_argument("--realcheck", action="store_true", help="Plan v5 Real Check Short: the verdict stamp is the open loop, no spoken promise line needed; v5.1 length cap 28 s")
    ap.add_argument("--owner-voice", action="store_true", help="v5.1: narration is the owner's recording (tools/owner_voice.py): skip the TTS pace, gap and [pause] checks, allow up to 3.4 words/s speaking")
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

    if a.owner_voice:
        if speak > 3.4:
            problems.append(f"owner speaking pace {speak:.2f} words/s > 3.4 (ask the owner to re-record a little slower)")
    elif pace > 2.3:
        problems.append(f"overall pace {pace:.2f} words/s > 2.3 (slow down: fewer words, longer pauses)")
    if not a.owner_voice and speak > 3.2:
        problems.append(f"speaking pace {speak:.2f} words/s > 3.2 (voice speed 0.85 from voice.json, fewer and simpler words)")
    if not a.owner_voice and len([p for p in pauses if p >= 0.5]) < 2:
        problems.append("fewer than two [pause 0.5+] rows (add pauses after the stakes, before the twist and the takeaway)")
    if not a.owner_voice and avg_gap < 0.35:
        problems.append(f"average gap between lines {avg_gap:.2f} s < 0.35 (run voiceover.py with --gap 0.45)")
    cap = 45.0 if a.allow_long else (28.0 if a.realcheck else 40.0)
    if total_s > cap:
        problems.append(f"length {total_s:.1f} s > {cap:.0f} s (Real Check v5.1: 20-26 s, hard cap 28 s; otherwise aim ~30 s; cut words, not pauses)")
    PROMISE = re.compile(r"\b(end|last|wait|stay|until|finish|final)\b", re.I)
    if not a.realcheck and not any(PROMISE.search(l) for l in lines[:3]):
        problems.append("no promise-to-the-end in the first three lines (e.g. 'Wait for the last part.')")
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
    if total_s > 34:
        print(f"note: {total_s:.1f} s is over the ~30 s sweet spot (cap 40 s)")
    if problems:
        print("FAIL")
        for p in problems:
            print("  -", p)
        sys.exit(1)
    print("PASS")


if __name__ == "__main__":
    main()
