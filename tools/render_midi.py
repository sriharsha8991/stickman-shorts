#!/usr/bin/env python3
"""Render a .mid file to WAV/MP3 with a SoundFont, fully offline (no fluidsynth needed).

Uses tinysoundfont (pip install --no-deps tinysoundfont) + mido.
Usage: python3 render_midi.py song.mid out.mp3 [--sf2 PATH] [--gain DB] [--reverb]
"""
import argparse
import os
import subprocess
import sys
import tempfile
import wave

import mido
import numpy as np
import tinysoundfont

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SF2 = os.path.join(HERE, "..", "soundfonts", "gu", "GeneralUser-GS.sf2")
SR = 44100


def render(mid_path: str, sf2: str, gain: float) -> np.ndarray:
    synth = tinysoundfont.Synth(gain=gain, samplerate=SR)
    sfid = synth.sfload(sf2)
    for ch in range(16):
        synth.program_select(ch, sfid, 128 if ch == 9 else 0, 0, is_drums=(ch == 9))
    mid = mido.MidiFile(mid_path)
    chunks = []

    def gen(seconds: float):
        n = int(round(seconds * SR))
        if n > 0:
            buf = synth.generate(n)
            chunks.append(np.frombuffer(buf, dtype=np.float32).reshape(-1, 2).copy())

    for msg in mid:  # iterating a MidiFile yields messages with .time in seconds
        gen(msg.time)
        if msg.type == "note_on" and msg.velocity > 0:
            synth.noteon(msg.channel, msg.note, msg.velocity)
        elif msg.type == "note_off" or (msg.type == "note_on" and msg.velocity == 0):
            synth.noteoff(msg.channel, msg.note)
        elif msg.type == "program_change":
            if msg.channel == 9:
                synth.program_select(9, sfid, 128, msg.program, is_drums=True)
            else:
                synth.program_select(msg.channel, sfid, 0, msg.program)
        elif msg.type == "control_change":
            synth.control_change(msg.channel, msg.control, msg.value)
        elif msg.type == "pitchwheel":
            synth.pitchbend(msg.channel, msg.pitch + 8192)
    gen(1.5)  # release tails
    return np.concatenate(chunks) if chunks else np.zeros((0, 2), np.float32)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("midi")
    ap.add_argument("out")
    ap.add_argument("--sf2", default=DEFAULT_SF2)
    ap.add_argument("--gain", type=float, default=0.0)
    ap.add_argument("--reverb", action="store_true", help="add a light room reverb with ffmpeg")
    ap.add_argument("--length", type=float, default=None, help="trim/pad to exactly this many seconds")
    a = ap.parse_args()

    audio = render(a.midi, a.sf2, a.gain)
    if a.length is not None:
        n = int(round(a.length * SR))
        audio = audio[:n] if len(audio) >= n else np.vstack([audio, np.zeros((n - len(audio), 2), np.float32)])
    peak = float(np.max(np.abs(audio))) if len(audio) else 0.0
    if peak > 0:
        audio = audio / peak * 0.89  # -1 dBFS peak
    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)

    with tempfile.TemporaryDirectory() as td:
        raw = os.path.join(td, "raw.wav")
        with wave.open(raw, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        filters = []
        if a.reverb:
            filters.append("aecho=0.8:0.6:45|90:0.25|0.15")
        filters.append("volume=6dB")
        filters.append("alimiter=limit=0.9:level=disabled")  # static: keeps section dynamics intact
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", ",".join(filters), "-ar", str(SR)]
        if a.length is not None:
            cmd += ["-t", f"{a.length:.3f}"]
        cmd.append(a.out)
        subprocess.run(cmd, check=True)
    print(f"rendered {a.out}  ({len(audio) / SR:.1f} s)")


if __name__ == "__main__":
    sys.exit(main())
