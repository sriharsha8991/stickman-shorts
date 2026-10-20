#!/usr/bin/env python3
"""Offline voiceover for Stickman Shorts (Kokoro TTS, runs locally — no API, no cloud).

Input: a script with one spoken caption line per row (blank lines and '#' lines are ignored;
'[pause 0.6]' on its own row inserts silence).
Output:
  studio/public/<slug>/voice.wav      the narration (44.1 kHz stereo)
  studio/src/<slug>/voice.ts          per-line + per-word frame timings and a per-frame mouth curve
  studio/src/<slug>/timeline.ts       the engine's TIMELINE (so cues.ts / music ducking / Captions work)

Every line is synthesised separately, so line timings are exact; word timings inside a line are
estimated from syllable weight. The host's voice and speed come from studio/voice.json so the whole
channel keeps ONE consistent voice.

Usage:
  python3 tools/voiceover.py --slug v003-streak-hostage --script studio/src/v003-streak-hostage/voice.txt
"""
import argparse
import json
import os
import re
import subprocess
import tempfile
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(ROOT, "_vendor", "kokoro", "kokoro-v1.0.int8.onnx")
VOICES = os.path.join(ROOT, "_vendor", "kokoro", "voices-v1.0.bin")
CONFIG = os.path.join(ROOT, "studio", "voice.json")
FPS = 30


def syllables(word: str) -> float:
    w = re.sub(r"[^a-z0-9₹%]", "", word.lower())
    if not w:
        return 0.5
    if any(ch.isdigit() for ch in w):
        return max(1.0, len(w) * 0.9)  # numbers are spoken long ("two hundred thousand")
    groups = re.findall(r"[aeiouy]+", w)
    n = max(1, len(groups) - (1 if w.endswith("e") and len(groups) > 1 else 0))
    return float(n)


def word_times(text: str, start: int, end: int):
    words = text.split()
    if not words:
        return []
    weights = []
    for w in words:
        wt = syllables(w) + 0.35
        if re.search(r"[,;:—–-]$", w):
            wt += 0.6
        if re.search(r"[.!?…]$", w):
            wt += 0.9
        weights.append(wt)
    total = sum(weights)
    out, t = [], float(start)
    span = max(1, end - start)
    for w, wt in zip(words, weights):
        d = span * wt / total
        out.append({"w": w, "s": int(round(t)), "e": int(round(t + d))})
        t += d
    return out


def mouth_curve(audio: np.ndarray, sr: int, n_frames: int):
    hop = sr / FPS
    rms = np.zeros(n_frames, np.float32)
    for k in range(n_frames):
        a = int(k * hop)
        b = int(min(len(audio), (k + 1) * hop))
        if b > a:
            seg = audio[a:b]
            rms[k] = float(np.sqrt(np.mean(seg * seg)))
    voiced = rms[rms > 1e-4]
    ref = float(np.percentile(voiced, 97)) if len(voiced) else 1.0
    m = np.clip(rms / max(ref, 1e-6), 0, 1.0) ** 0.9
    # syllable motion: emphasise frame-to-frame changes so the lips close between syllables
    d = np.abs(np.diff(m, prepend=m[:1]))
    m = np.clip(m * 0.8 + d * 0.9, 0, 1)
    out = np.zeros_like(m)
    v = 0.0
    for k, x in enumerate(m):  # fast attack, quick release
        v = x if x > v else v * 0.3 + x * 0.7
        out[k] = v
    out[out < 0.12] = 0.0
    return [round(float(x), 2) for x in np.clip(out, 0, 1)]


def main():
    cfg = {"voice": "am_michael", "speed": 1.1, "lang": "en-us"}
    if os.path.exists(CONFIG):
        cfg.update(json.load(open(CONFIG)))
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--script", required=True)
    ap.add_argument("--voice", default=cfg["voice"])
    ap.add_argument("--speed", type=float, default=cfg["speed"])
    ap.add_argument("--lead", type=float, default=0.2, help="silence before the first line (s)")
    ap.add_argument("--gap", type=float, default=0.16, help="silence between lines (s)")
    ap.add_argument("--tail", type=float, default=0.6, help="silence after the last line (s)")
    a = ap.parse_args()

    from kokoro_onnx import Kokoro

    k = Kokoro(MODEL, VOICES)
    rows = [r.strip() for r in open(a.script, encoding="utf-8").read().splitlines()]
    sr = 24000
    chunks = [np.zeros(int(a.lead * sr), np.float32)]
    t = a.lead
    cues = []
    for r in rows:
        if not r or r.startswith("#"):
            continue
        m = re.fullmatch(r"\[pause\s+([\d.]+)\]", r)
        if m:
            chunks.append(np.zeros(int(float(m.group(1)) * sr), np.float32))
            t += float(m.group(1))
            continue
        audio, sr = k.create(r, voice=a.voice, speed=a.speed, lang=cfg.get("lang", "en-us"))
        audio = audio.astype(np.float32)
        dur = len(audio) / sr
        s_f, e_f = int(round(t * FPS)), int(round((t + dur) * FPS))
        cues.append({"i": len(cues), "text": r, "start": round(t, 3), "end": round(t + dur, 3),
                     "startFrame": s_f, "endFrame": e_f, "words": word_times(r, s_f, e_f)})
        chunks.append(audio)
        chunks.append(np.zeros(int(a.gap * sr), np.float32))
        t += dur + a.gap
    chunks.append(np.zeros(int(a.tail * sr), np.float32))
    voice = np.concatenate(chunks)
    peak = float(np.abs(voice).max()) or 1.0
    voice = voice / peak * 0.89
    n_frames = int(np.ceil(len(voice) / sr * FPS))
    mouth = mouth_curve(voice, sr, n_frames)

    pub = os.path.join(ROOT, "studio", "public", a.slug)
    src = os.path.join(ROOT, "studio", "src", a.slug)
    os.makedirs(pub, exist_ok=True)
    os.makedirs(src, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        raw = os.path.join(td, "v.wav")
        with wave.open(raw, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes((voice * 32767).astype(np.int16).tobytes())
        # light broadcast polish: gentle high-pass, presence lift, compression
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af",
                        "highpass=f=80,equalizer=f=3000:t=q:w=1.2:g=2.5,acompressor=threshold=-18dB:ratio=3:attack=5:release=60,alimiter=limit=0.9",
                        "-ar", "44100", "-ac", "2", os.path.join(pub, "voice.wav")], check=True)

    with open(os.path.join(src, "voice.ts"), "w", encoding="utf-8") as fh:
        fh.write("// Generated by tools/voiceover.py — re-run it instead of editing by hand.\n")
        fh.write(f"// voice: {a.voice} @ {a.speed}x · {len(cues)} lines · {len(voice) / sr:.2f} s\n")
        fh.write("export type VWord = { w: string; s: number; e: number };\n")
        fh.write("export type VCue = { i: number; text: string; startFrame: number; endFrame: number; words: VWord[] };\n")
        fh.write(f"export const VOICE_FRAMES = {n_frames};\n")
        fh.write("export const VOICE_CUES: VCue[] = " + json.dumps(
            [{k2: c[k2] for k2 in ("i", "text", "startFrame", "endFrame", "words")} for c in cues], ensure_ascii=False) + ";\n")
        fh.write("export const MOUTH: number[] = " + json.dumps(mouth) + ";\n")
        fh.write("// global frame -> mouth openness 0..1\n")
        fh.write("export const mouthAt = (frame: number) => MOUTH[Math.max(0, Math.min(MOUTH.length - 1, Math.round(frame)))] ?? 0;\n")
        fh.write("export const vStart = (i: number) => VOICE_CUES[Math.min(i, VOICE_CUES.length - 1)].startFrame;\n")
        fh.write("export const vEnd = (i: number) => VOICE_CUES[Math.min(i, VOICE_CUES.length - 1)].endFrame;\n")

    timeline = {"fps": FPS, "durationInFrames": n_frames, "seconds": round(len(voice) / sr, 2),
                "cues": [{"i": c["i"], "start": c["start"], "end": c["end"], "startFrame": c["startFrame"],
                          "endFrame": c["endFrame"], "words": len(c["text"].split()), "text": c["text"]} for c in cues],
                "chapters": []}
    with open(os.path.join(src, "timeline.ts"), "w", encoding="utf-8") as fh:
        fh.write("// Generated by tools/voiceover.py from the synthesized voice.\n")
        fh.write("export type TimelineCue = { i: number; start: number; end: number; startFrame: number; endFrame: number; words: number; text: string };\n")
        fh.write("export type TimelineChapter = { title: string; startFrame: number; endFrame: number };\n")
        fh.write("export type Timeline = { fps: number; durationInFrames: number; seconds: number; cues: TimelineCue[]; chapters: TimelineChapter[] };\n")
        fh.write("export const TIMELINE: Timeline = " + json.dumps(timeline, indent=2, ensure_ascii=False) + ";\n")
    with open(os.path.join(src, "timeline.json"), "w", encoding="utf-8") as fh:
        json.dump(timeline, fh, indent=2, ensure_ascii=False)

    print(json.dumps({"voice": a.voice, "speed": a.speed, "seconds": round(len(voice) / sr, 2),
                      "frames": n_frames, "lines": len(cues),
                      "cues": [(c["startFrame"], c["endFrame"], c["text"]) for c in cues]}, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
