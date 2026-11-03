#!/usr/bin/env python3
"""Score for V030 "Did you get your microwave from melted chocolate?" (v030-melted-bar).

Mischief in a lab: 6/8, D minor, 96 BPM (dotted-quarter pulse), pizzicato + bassoon, clarinet answers in the gaps (different from
H30's A-major marimba, V029's waltz). Kitchen opening in F major, soft celesta. Lab from "The story says" (7.4 s). Pops at 15.5 s:
woodblock + xylophone scatter. Kettle (18 s): low tremolo strings climb. Silence from the end of the co-worker line, the half-second
drop before "exploded" (24.4 s): brass + timpani + cymbal, strings hold through the best picture. Kitchen (28.7 s): F major celesta,
light, so it loops into frame 0.
"""
import os

import mido

BPM = 96  # dotted-quarter feel; time grid is seconds
TPB = 480
SEC = TPB * BPM / 60


HERE = os.path.dirname(os.path.abspath(__file__))

PIZ, BSN, CLA, STR, BRASS, CEL, TIMP, XYL, DRUMS = 0, 1, 2, 3, 4, 5, 6, 7, 9
PROGRAMS = {PIZ: 45, BSN: 70, CLA: 71, STR: 48, BRASS: 61, CEL: 8, TIMP: 47, XYL: 13}

LAB = 7.2
POP = 15.5
KETTLE = 18.0
DROP0 = 22.9
BOOM = 24.42
KITCHEN = 28.9
END = 36.4
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, pitch, start_s, dur_s, vel):
    a, b = t(start_s), t(start_s + dur_s)
    events.append((a, 1, mido.Message("note_on", channel=ch, note=pitch, velocity=max(1, min(127, vel)))))
    events.append((b, 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))

    E = 60 / BPM / 2  # eighth note
    M = 6 * E

    # hit on "Stop", little celesta question
    note(DRUMS, 36, 0.2, 0.2, 70)
    chord(PIZ, [41, 53, 60], 0.2, 0.3, 74)

    # kitchen: soft F major, sparse
    s = 0.9
    i = 0
    while s < LAB - 0.3:
        root, tones = [(41, [65, 69, 72]), (46, [65, 70, 74]), (48, [64, 67, 72]), (41, [65, 69, 72])][i % 4]
        note(PIZ, root, s, E * 1.5, 54)
        for j, p in enumerate(tones):
            note(CEL, p + 12, s + E * (j * 2 + 1), E, 36)
        s += M
        i += 1
    for j, p in enumerate([72, 74, 77, 81]):  # "messy" wink
        note(CEL, p + 12, 6.2 + j * 0.09, 0.2, 56)

    # lab: D minor sneak, pizzicato bass + bassoon stabs; clarinet only in the gaps
    s = LAB
    i = 0
    CH = [(38, [50, 53, 57]), (43, [50, 55, 58]), (45, [49, 52, 57]), (38, [50, 53, 57])]
    while s < POP - 0.1:
        root, tones = CH[i % 4]
        note(PIZ, root, s, E, 66)
        note(PIZ, tones[0] + 12, s + 2 * E, E * 0.7, 46)
        note(PIZ, root + 7, s + 3 * E, E, 56)
        note(BSN, tones[1], s + 5 * E, E * 0.8, 42)
        s += M
        i += 1
    for j, p in enumerate([74, 77, 76, 74]):  # after "machine"
        note(CLA, p, 11.75 + j * E * 0.6, E * 0.55, 54)

    # popcorn: xylophone + woodblock scatter
    import random

    r = random.Random(30)
    for k in range(34):
        at = POP + 0.05 + k * 0.058 + r.random() * 0.02
        note(XYL, r.choice([74, 77, 79, 81, 84, 86, 89]), at, 0.09, 52 + r.randint(0, 22))
        if k % 3 == 0:
            note(DRUMS, 76, at, 0.05, 44)
    note(PIZ, 38, POP, 0.3, 70)

    # kettle: low tremolo climbs, pizzicato ticks get closer
    n = int((DROP0 - KETTLE) / 0.16)
    for k in range(n):
        at = KETTLE + k * 0.16
        prog = k / max(1, n)
        note(STR, 38 + int(prog * 12) // 2 * 1, at, 0.14, int(30 + 48 * prog))
        if k % 3 == 0:
            note(PIZ, 50 + int(prog * 12), at, 0.12, int(40 + 30 * prog))

    # DROP: nothing from 22.9 to 24.4 s except nothing. Then the hit.
    chord(BRASS, [38, 50, 57, 62, 65, 69], BOOM, 1.3, 106)
    chord(STR, [38, 50, 57, 62, 65, 69, 74], BOOM, KITCHEN - 2.0 - BOOM, 64)
    note(TIMP, 38, BOOM, 0.5, 116)
    note(DRUMS, 49, BOOM, 1.8, 92)
    note(DRUMS, 57, BOOM + 0.02, 1.6, 74)
    note(DRUMS, 36, BOOM, 0.3, 96)
    for j, p in enumerate([86, 89, 93, 98]):
        note(XYL, p, BOOM + 0.5 + j * 0.13, 0.2, 58)

    # "Invisible waves": clarinet thought alone
    for j, p in enumerate([69, 72, 77, 76]):
        note(CLA, p, 27.0 + j * E * 1.1, E, 44)

    # kitchen again: F major, light, loops
    s = KITCHEN
    i = 0
    note(DRUMS, 76, KITCHEN, 0.05, 40)
    while s < END - 0.25:
        root, tones = [(41, [65, 69, 72]), (46, [65, 70, 74]), (48, [64, 67, 72]), (41, [65, 69, 72])][i % 4]
        note(PIZ, root, s, E * 1.5, 50)
        for j, p in enumerate(tones):
            note(CEL, p + 12, s + E * (j * 2 + 1), E, 34)
        s += M
        i += 1
    note(PIZ, 41, END - 0.25, 0.2, 54)

    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    last = 0
    for at, _, m in events:
        tr.append(m.copy(time=at - last))
        last = at
    mid.save(os.path.join(HERE, "v030-melted-bar.mid"))


if __name__ == "__main__":
    main()
