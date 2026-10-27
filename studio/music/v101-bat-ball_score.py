#!/usr/bin/env python3
"""Score for V101 · Bat and ball (10-second test, 18.7 s).

Playful, curious bed in D major, 100 BPM (1 beat = 0.6 s, 1 bar = 2.4 s). Sparse under the voice:
  0.0–6.0 s   question: pizzicato strings walking D–Bm–G–A, soft marimba ticks (thinking clock)
  6.0–9.4 s   Spark's "Ten?": bouncier pizz + woodblock, a little bassoon wobble (confident and wrong)
  9.4–10.3 s  "one-twenty": low minor stab (Bm), then DROP to silence before the reveal
  11.37 s     "five": bright glockenspiel + crash + major chord (the aha)
  11.8–18.7 s mid-energy bed (G–D–A–D), thinning out; the last bar mirrors bar 0 so the loop cuts clean
Writes v101-bat-ball.mid next to this file. Render with tools/render_midi.py.
"""
import os
import mido

TPB = 480
BPM = 100
TPS = TPB * BPM / 60  # ticks per second
HERE = os.path.dirname(os.path.abspath(__file__))
PIZZ, MARIMBA, GLOCK, BASSOON, PAD, BASS, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {PIZZ: 45, MARIMBA: 12, GLOCK: 9, BASSOON: 70, PAD: 89, BASS: 32}
events = []


def t(sec):
    return int(round(sec * TPS))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


B = 0.6  # beat
CH = {"D": (50, [62, 66, 69]), "Bm": (47, [59, 62, 66]), "G": (43, [59, 62, 67]), "A": (45, [61, 64, 69])}


def pizz_bar(s, name, v=58, bounce=False):
    root, c = CH[name]
    note(BASS, root, s, B * 0.8, v + 6)
    pat = [0, 1, 2, 1] if not bounce else [0, 2, 1, 2]
    for k, i in enumerate(pat):
        note(PIZZ, c[i], s + k * B + (B / 2 if bounce and k % 2 else 0), B * 0.4, v - (0 if k == 0 else 8))


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {PIZZ: 92, MARIMBA: 80, GLOCK: 86, BASSOON: 72, PAD: 60, BASS: 84, DRUMS: 80}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (PIZZ, GLOCK, PAD, MARIMBA):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=60)))

    # 0–6 s: the question (D Bm G A, half-bar each = 1.2 s... use one chord per 1.2 s)
    s = 0.0
    for name in ["D", "Bm", "G", "A"]:
        root, c = CH[name]
        note(BASS, root, s, 1.0, 58)
        for k, i in enumerate([0, 1, 2, 1]):
            note(PIZZ, c[i], s + k * 0.3, 0.2, 56 if k == 0 else 46)
        s += 1.2
    for k in range(8):  # thinking-clock ticks on marimba over the question
        note(MARIMBA, 81 if k % 2 == 0 else 76, 4.8 + k * 0.15, 0.1, 44)
    # 6.0–9.4 s: confident + wrong
    s = 6.0
    for name in ["D", "G", "A"]:
        root, c = CH[name]
        note(BASS, root, s, 0.5, 62)
        note(BASS, root + 7, s + 0.6, 0.4, 52)
        for k, i in enumerate([0, 2, 1, 2]):
            note(PIZZ, c[i] + 12, s + k * 0.3, 0.18, 54 if k == 0 else 44)
        note(DRUMS, 76, s, 0.1, 60)  # woodblock
        note(DRUMS, 77, s + 0.6, 0.1, 50)
        s += 1.2
    note(BASSOON, 50, 7.0, 0.35, 58)
    note(BASSOON, 54, 7.4, 0.35, 58)
    note(BASSOON, 57, 7.8, 0.6, 62)
    # 9.4–10.3 s: the wrong total — low minor stab, then silence
    for p in [47, 59, 62, 66]:
        note(PAD if p > 50 else BASS, p, 9.55, 0.7, 70)
    note(DRUMS, 41, 9.6, 0.2, 80)
    # 11.37 s: the aha
    A = 11.37
    note(DRUMS, 49, A, 1.2, 96)
    note(DRUMS, 36, A, 0.2, 100)
    for k, p in enumerate([74, 78, 81, 86]):
        note(GLOCK, p, A + k * 0.1, 0.5, 92 - k * 4)
    for p in [62, 66, 69, 74]:
        note(PAD, p, A, 2.2, 70)
    note(BASS, 50, A, 1.0, 76)
    # 12.6–18.7 s: mid bed, thinning out; ends on the opening D figure (loop)
    s = 12.6
    for j, name in enumerate(["G", "D", "A", "Bm", "G"]):
        root, c = CH[name]
        v = 50 - j * 2
        note(BASS, root, s, 1.0, v + 6)
        for k, i in enumerate([0, 1, 2, 1]):
            note(PIZZ, c[i], s + k * 0.3, 0.2, v if k == 0 else v - 8)
        if j in (1, 3):
            note(MARIMBA, c[2] + 12, s + 0.9, 0.2, 46)
        s += 1.2
    root, c = CH["D"]
    note(BASS, root, 18.6 - 0.6, 0.5, 52)
    note(PIZZ, c[0], 18.0, 0.2, 50)
    note(PIZZ, c[1], 18.3, 0.2, 44)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v101-bat-ball.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
