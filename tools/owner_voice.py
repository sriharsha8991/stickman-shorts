#!/usr/bin/env python3
"""Owner voiceover for Stickman Shorts (Plan v5.1, owner 2026-11-10: from Sun 15 Nov the owner records the narration).

Same outputs as tools/voiceover.py, but the audio is the OWNER'S recording instead of Kokoro:
  studio/public/<slug>/voice.wav      the narration (44.1 kHz stereo, cleaned, pauses tidied)
  studio/src/<slug>/voice.ts          per-line + per-word frame timings and a per-frame mouth curve
  studio/src/<slug>/timeline.ts/.json the engine's TIMELINE

The owner records ONE file per Short (phone voice memo: m4a, mp3, wav, ogg, aac all fine), reading the lines of
voice.txt in order and leaving a clear silence (about one second) between lines. This tool finds the silences, so each
spoken line gets its real start and end; word timings inside a line are estimated from syllable weight (as in
voiceover.py). Pauses between lines are kept as recorded but clamped to --min-gap..--max-gap so there is no dead air.

  python3 tools/owner_voice.py --slug r07-knuckles --script studio/src/r07-knuckles/voice.txt --audio <file>

--audio may be the media file itself, or the JSON file that Drive download_file_content saved (base64 in "content").

Exit 1 with a clear message when the number of spoken chunks is lower than the number of script lines (the lines ran
together): re-run with a smaller --min-silence (0.25 → 0.15), and if it still fails ask the owner to re-record with
longer pauses. '[pause x]' rows and '#' rows in the script are ignored here: the owner's own pauses are used.
"""
import argparse
import base64
import json
import os
import re
import subprocess
import sys
import tempfile
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voiceover import FPS, ROOT, mouth_curve, word_times  # noqa: E402

SR = 24000


def materialise(path: str, td: str) -> str:
    """Return a path ffmpeg can read: the file itself, or the base64 payload of a saved Drive tool result."""
    with open(path, "rb") as fh:
        head = fh.read(64).lstrip()
    if not head.startswith(b"{") and not head.startswith(b"["):
        return path
    d = json.load(open(path, encoding="utf-8", errors="ignore"))

    def find(o):
        if isinstance(o, dict):
            for k in ("content", "data", "blob", "base64Content"):
                if isinstance(o.get(k), str) and len(o[k]) > 2000:
                    return o[k]
            for v in o.values():
                r = find(v)
                if r:
                    return r
        if isinstance(o, list):
            for v in o:
                r = find(v)
                if r:
                    return r
        if isinstance(o, str) and len(o) > 2000 and o.lstrip().startswith("{"):
            try:
                return find(json.loads(o))
            except Exception:  # noqa: BLE001
                return None
        return None

    b64 = find(d)
    if not b64:
        sys.exit("owner_voice: no base64 audio found in the saved Drive result")
    out = os.path.join(td, "owner_audio.bin")
    with open(out, "wb") as fh:
        fh.write(base64.b64decode(b64))
    return out


def decode(path: str, td: str) -> np.ndarray:
    wav = os.path.join(td, "in.wav")
    # mono 24 kHz, rumble cut, light denoise so room hiss does not hide the pauses
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-af", "highpass=f=80,afftdn=nr=10", "-ar", str(SR),
                    "-ac", "1", wav], check=True)
    with wave.open(wav, "rb") as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768.0
    return a


def speech_chunks(a: np.ndarray, min_silence: float):
    """[(start_s, end_s)] of speech, split on silences of at least min_silence seconds."""
    win = int(SR * 0.02)
    n = len(a) // win
    rms = np.sqrt(np.mean(a[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    floor = float(np.percentile(rms, 10))
    loud = float(np.percentile(rms, 95))
    thr = max(floor * 3.0, loud * 0.08, 0.004)
    voiced = rms > thr
    chunks, start, quiet = [], None, 0
    need = int(round(min_silence / 0.02))
    for i, v in enumerate(voiced):
        if v:
            if start is None:
                start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet >= need:
                chunks.append((start * 0.02, (i - quiet + 1) * 0.02))
                start, quiet = None, 0
    if start is not None:
        chunks.append((start * 0.02, (n - quiet) * 0.02))
    # drop clicks and coughs
    return [(s, e) for s, e in chunks if e - s >= 0.25]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--script", required=True)
    ap.add_argument("--audio", required=True, help="the owner's recording, or the saved Drive download result (JSON)")
    ap.add_argument("--min-silence", type=float, default=0.25, help="a pause at least this long splits two lines (s)")
    ap.add_argument("--lead", type=float, default=0.2)
    ap.add_argument("--tail", type=float, default=0.6)
    ap.add_argument("--min-gap", type=float, default=0.3, help="shortest pause kept between lines (s)")
    ap.add_argument("--max-gap", type=float, default=0.9, help="longest pause kept between lines (s)")
    a = ap.parse_args()

    rows = [r.strip() for r in open(a.script, encoding="utf-8").read().splitlines()]
    lines = [r for r in rows if r and not r.startswith("#") and not re.fullmatch(r"\[pause\s+[\d.]+\]", r)]

    with tempfile.TemporaryDirectory() as td:
        audio = decode(materialise(a.audio, td), td)
        chunks = speech_chunks(audio, a.min_silence)
        if len(chunks) < len(lines):
            sys.exit(f"owner_voice: heard {len(chunks)} spoken chunks but the script has {len(lines)} lines "
                     f"(chunk lengths: {[round(e - s, 1) for s, e in chunks]} s). Try --min-silence 0.15; if it still "
                     "fails, the lines ran together: ask the owner to re-record with a one-second pause between lines.")
        # more chunks than lines = a pause inside a line: join across the shortest gaps until they match
        while len(chunks) > len(lines):
            gaps = [chunks[i + 1][0] - chunks[i][1] for i in range(len(chunks) - 1)]
            j = int(np.argmin(gaps))
            chunks[j:j + 2] = [(chunks[j][0], chunks[j + 1][1])]

        pad = 0.06  # keep the breath of the first and last sound
        fade = int(SR * 0.008)
        parts, t, cues = [np.zeros(int(a.lead * SR), np.float32)], a.lead, []
        for i, ((s, e), text) in enumerate(zip(chunks, lines)):
            seg = audio[max(0, int((s - pad) * SR)): min(len(audio), int((e + pad) * SR))].copy()
            if len(seg) > 2 * fade:
                seg[:fade] *= np.linspace(0, 1, fade)
                seg[-fade:] *= np.linspace(1, 0, fade)
            dur = len(seg) / SR
            s_f, e_f = int(round(t * FPS)), int(round((t + dur) * FPS))
            cues.append({"i": i, "text": text, "start": round(t, 3), "end": round(t + dur, 3),
                         "startFrame": s_f, "endFrame": e_f, "words": word_times(text, s_f, e_f)})
            parts.append(seg)
            t += dur
            if i < len(chunks) - 1:
                gap = float(np.clip(chunks[i + 1][0] - e - 2 * pad, a.min_gap, a.max_gap))
                parts.append(np.zeros(int(gap * SR), np.float32))
                t += gap
        parts.append(np.zeros(int(a.tail * SR), np.float32))
        voice = np.concatenate(parts)
        voice = voice / (float(np.abs(voice).max()) or 1.0) * 0.89
        n_frames = int(np.ceil(len(voice) / SR * FPS))
        mouth = mouth_curve(voice, SR, n_frames)

        pub = os.path.join(ROOT, "studio", "public", a.slug)
        src = os.path.join(ROOT, "studio", "src", a.slug)
        os.makedirs(pub, exist_ok=True)
        os.makedirs(src, exist_ok=True)
        raw = os.path.join(td, "v.wav")
        with wave.open(raw, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((voice * 32767).astype(np.int16).tobytes())
        # phone-recording polish: rumble cut, presence lift, even out the level, limit
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af",
                        "highpass=f=90,equalizer=f=3200:t=q:w=1.2:g=2.5,"
                        "acompressor=threshold=-20dB:ratio=3.5:attack=5:release=80:makeup=2,alimiter=limit=0.9",
                        "-ar", "44100", "-ac", "2", os.path.join(pub, "voice.wav")], check=True)

    secs = len(voice) / SR
    with open(os.path.join(src, "voice.ts"), "w", encoding="utf-8") as fh:
        fh.write("// Generated by tools/owner_voice.py from the owner's recording — re-run it instead of editing by hand.\n")
        fh.write(f"// voice: owner · {len(cues)} lines · {secs:.2f} s\n")
        fh.write("export type VWord = { w: string; s: number; e: number };\n")
        fh.write("export type VCue = { i: number; text: string; startFrame: number; endFrame: number; words: VWord[] };\n")
        fh.write(f"export const VOICE_FRAMES = {n_frames};\n")
        fh.write("export const VOICE_CUES: VCue[] = " + json.dumps(
            [{k: c[k] for k in ("i", "text", "startFrame", "endFrame", "words")} for c in cues], ensure_ascii=False) + ";\n")
        fh.write("export const MOUTH: number[] = " + json.dumps(mouth) + ";\n")
        fh.write("// global frame -> mouth openness 0..1\n")
        fh.write("export const mouthAt = (frame: number) => MOUTH[Math.max(0, Math.min(MOUTH.length - 1, Math.round(frame)))] ?? 0;\n")
        fh.write("export const vStart = (i: number) => VOICE_CUES[Math.min(i, VOICE_CUES.length - 1)].startFrame;\n")
        fh.write("export const vEnd = (i: number) => VOICE_CUES[Math.min(i, VOICE_CUES.length - 1)].endFrame;\n")

    timeline = {"fps": FPS, "durationInFrames": n_frames, "seconds": round(secs, 2),
                "cues": [{"i": c["i"], "start": c["start"], "end": c["end"], "startFrame": c["startFrame"],
                          "endFrame": c["endFrame"], "words": len(c["text"].split()), "text": c["text"]} for c in cues],
                "chapters": []}
    with open(os.path.join(src, "timeline.ts"), "w", encoding="utf-8") as fh:
        fh.write("// Generated by tools/owner_voice.py from the owner's recording.\n")
        fh.write("export type TimelineCue = { i: number; start: number; end: number; startFrame: number; endFrame: number; words: number; text: string };\n")
        fh.write("export type TimelineChapter = { title: string; startFrame: number; endFrame: number };\n")
        fh.write("export type Timeline = { fps: number; durationInFrames: number; seconds: number; cues: TimelineCue[]; chapters: TimelineChapter[] };\n")
        fh.write("export const TIMELINE: Timeline = " + json.dumps(timeline, indent=2, ensure_ascii=False) + ";\n")
    with open(os.path.join(src, "timeline.json"), "w", encoding="utf-8") as fh:
        json.dump(timeline, fh, indent=2, ensure_ascii=False)

    words = sum(len(c["text"].split()) for c in cues)
    print(json.dumps({"voice": "owner", "seconds": round(secs, 2), "frames": n_frames, "lines": len(cues),
                      "words_per_second": round(words / secs, 2),
                      "cues": [(c["startFrame"], c["endFrame"], c["text"]) for c in cues]}, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
