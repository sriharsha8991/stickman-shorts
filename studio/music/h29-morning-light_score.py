#!/usr/bin/env python3
"""Score for H29 "Your alarm is not what sets your body clock." (dark bedroom -> forest camp -> sunny bedroom).

84 BPM, 4/4 -> 1 bar = 2.857 s = 85.7 frames. 15 bars = 42.9 s. Calm morning bed, sparse under the voice:
  bars 0-5   dark bedroom  D major, soft low piano broken chords + woodblock clock ticks; bar 5 celesta lift (light can)
  bars 6-11  forest camp   warm pad + gentle flute, light shaker; bar 8 night (pad only), bar 9 sunrise flute rise
  bars 12-14 sunny bedroom piano + pad + shaker together, D G A D; ends on D (loops to bar 0)
"""
import os

import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))
PNO, PAD, FLUTE, CEL, BASS, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {PNO: 0, PAD: 89, FLUTE: 73, CEL: 8, BASS: 32}
events = []


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def bar(b):
    return b * BAR


E8 = TPB // 2
CH = {
    "D": (50, [62, 66, 69, 74]),
    "Bm": (47, [59, 62, 66, 71]),
    "G": (43, [59, 62, 67, 71]),
    "A": (45, [61, 64, 69, 73]),
    "Em": (52, [59, 64, 67, 71]),
}


def piano_bar(b, name, vel=40, ticks=True):
    root, v = CH[name]
    s = bar(b)
    note(BASS, root - 12, s, BAR - 60, 44)
    for k, p in enumerate([v[0], v[1], v[2], v[1], v[3], v[2], v[1], v[2]]):
        note(PNO, p, s + k * E8, TPB, vel - (k % 2) * 6)
    if ticks:
        for k in range(4):
            note(DRUMS, 76 if k % 2 == 0 else 77, s + k * TPB, E8, 22)


def pad(b, name, n=1, vel=30):
    _, v = CH[name]
    for p in v[:3]:
        note(PAD, p, bar(b), BAR * n - 20, vel)


def shaker(b, vel=24):
    for k in range(8):
        note(DRUMS, 82, bar(b) + k * E8, E8, vel - (0 if k % 2 else 6))


# dark bedroom
for i, n in enumerate(["D", "Bm", "G", "A", "D"]):
    piano_bar(i, n, 36 if i < 4 else 34)
pad(5, "G", vel=28)
for k, p in enumerate([81, 86, 90, 93]):  # light can
    note(CEL, p, bar(5) + TPB + k * E8, TPB, 56 - k * 4)
# camp
for i, n in enumerate(["G", "D"]):
    pad(6 + i, n)
    shaker(6 + i)
    note(BASS, CH[n][0] - 12, bar(6 + i), BAR - 60, 40)
    note(FLUTE, CH[n][1][3], bar(6 + i) + 2 * TPB, TPB * 2, 40)
pad(8, "Em", vel=24)  # night
for k, p in enumerate([69, 71, 74, 76, 78, 81]):  # sunrise
    note(FLUTE, p, bar(9) + k * E8, TPB, 30 + k * 2)
for i, n in enumerate(["G", "D", "A"]):
    pad(9 + i, n, vel=30)
    shaker(9 + i, 22)
    note(BASS, CH[n][0] - 12, bar(9 + i), BAR - 60, 42)
note(FLUTE, 78, bar(10) + 2 * TPB, TPB * 2, 40)
# sunny bedroom
for i, n in enumerate(["D", "G", "A"]):
    piano_bar(12 + i, n, 42, ticks=False)
    pad(12 + i, n, vel=26)
    shaker(12 + i, 22)
note(CEL, 86, bar(12), TPB, 54)
note(CEL, 90, bar(12) + E8, TPB, 50)
pad(14, "D", vel=24)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(84), time=0))
for ch, pg in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=pg, time=0))
    tr.append(mido.Message("control_change", channel=ch, control=91, value=55, time=0))
last = 0
for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
    tr.append(m.copy(time=t - last))
    last = t
mid.save(os.path.join(HERE, "h29-morning-light.mid"))
print("wrote h29-morning-light.mid")
