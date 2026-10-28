#!/usr/bin/env python3
"""Score for V102 · Why you forget why you walked into a room (Your brain did this, 29.1 s).

Sunny, curious pizzicato + marimba in F major, 104 BPM. Sparse under the voice:
  0.0–6.6 s   tiptoe: pizzicato bass F–C–Dm–Bb, wood-block tick-tock (footsteps), one marimba note per bar
  6.6–6.97 s  DROP, 6.97 s the slice: low hit + cymbal, marimba falling run (the half dropping)
  7.2–10.0 s  "filed away": soft Dm–Bb, pad
  10.2–18.0 s blueprint lab: glockenspiel arps over C–F–G–C, light ticks
  18.0–19.6 s DROP before THE CATCH; 19.63 s stinger
  19.8–22.3 s busy mind: syncopated marimba on Dm–G (cluttered)
  22.3–25.0 s juggling: bouncy pizzicato eighths
  25.13 s     through the door intact: bright F major glock + pad
  26.4–29.1 s the opening figure again so the loop cuts clean
Writes v102-blame-the-door.mid next to this file. Render with tools/render_midi.py.
"""
import os
import mido

TPB = 480
BPM = 104
TPS = TPB * BPM / 60
B = 60 / BPM
HERE = os.path.dirname(os.path.abspath(__file__))
PIZZ, MARIMBA, GLOCK, BASS, PAD, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {PIZZ: 45, MARIMBA: 12, GLOCK: 9, BASS: 32, PAD: 89}
events = []


def t(sec):
    return int(round(sec * TPS))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


CH = {"F": (41, [65, 69, 72]), "C": (36, [64, 67, 72]), "Dm": (38, [62, 65, 69]), "Bb": (34, [62, 65, 70]), "G": (43, [62, 67, 71])}


def tiptoe(s0, s1, prog=("F", "C", "Dm", "Bb"), vel=52):
    s, k = s0, 0
    while s < s1 - 0.05:
        name = prog[(k // 4) % len(prog)]
        root, v = CH[name]
        beat = k % 4
        note(PIZZ, root + 12 + (7 if beat == 2 else 0), s, B * 0.4, vel - (8 if beat % 2 else 0))
        if beat in (1, 3):
            note(DRUMS, 76 if beat == 1 else 77, s, 0.1, 40)
        if beat == 0:
            note(MARIMBA, v[(k // 4) % 3] + 12, s + B * 0.5, B, vel - 12)
        s += B
        k += 1


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {PIZZ: 92, MARIMBA: 84, GLOCK: 80, BASS: 90, PAD: 54, DRUMS: 72}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    tiptoe(0.0, 6.6)
    # the slice
    S = 6.97
    note(DRUMS, 49, S, 1.2, 92)
    note(DRUMS, 36, S, 0.2, 96)
    note(BASS, 29, S, 0.8, 80)
    for k, p in enumerate([84, 81, 77, 74, 72, 69]):
        note(MARIMBA, p, S + 0.12 + k * 0.07, 0.25, 74 - k * 6)
    # filed away: soft Dm–Bb
    for j, name in enumerate(["Dm", "Bb"]):
        root, v = CH[name]
        s = 7.6 + j * 1.25
        note(PAD, v[0] - 12, s, 1.2, 46)
        note(PAD, v[2] - 12, s, 1.2, 42)
        note(BASS, root, s, 1.0, 54)
    note(DRUMS, 38, 9.2, 0.2, 54)  # drawer slam
    # blueprint lab: glock arps
    s, k = 10.2, 0
    prog = ["C", "F", "G", "C"]
    while s < 18.0:
        name = prog[(k // 8) % 4]
        root, v = CH[name]
        if k % 2 == 0:
            note(GLOCK, v[(k // 2) % 3] + 12, s, B * 0.6, 44)
        if k % 8 == 0:
            note(BASS, root, s, B * 3, 50)
            note(PAD, v[0] - 12, s, B * 4, 34)
        if k % 4 == 2:
            note(DRUMS, 42, s, 0.1, 30)
        s += B / 2
        k += 1
    # THE CATCH
    Cc = 19.63
    note(DRUMS, 49, Cc, 1.0, 84)
    note(BASS, 38, Cc, 0.6, 78)
    for p in [62, 65, 69, 74]:
        note(PIZZ, p, Cc, 0.3, 70)
    # busy mind: syncopated marimba
    s, k = 20.0, 0
    while s < 22.2:
        root, v = CH["Dm" if k < 6 else "G"]
        note(MARIMBA, v[k % 3] + (12 if k % 2 else 0), s, 0.18, 50)
        s += B * (0.75 if k % 2 else 0.5)
        k += 1
    # juggling: bouncy pizz eighths
    s, k = 22.35, 0
    while s < 25.0:
        root, v = CH[["F", "C"][(k // 4) % 2]]
        note(PIZZ, v[k % 3] + (0 if k % 2 else 12), s, 0.15, 48)
        if k % 4 == 0:
            note(BASS, root, s, B, 50)
        s += B / 2
        k += 1
    # through the door, intact: bright F major
    D = 25.13
    for k, p in enumerate([77, 81, 84, 89]):
        note(GLOCK, p, D + k * 0.08, 0.6, 82 - k * 4)
    for p in [53, 57, 60, 65]:
        note(PAD, p, D, 1.4, 58)
    note(BASS, 41, D, 1.0, 66)
    # loop: the opening figure
    tiptoe(26.4, 29.0, vel=44)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v102-blame-the-door.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
