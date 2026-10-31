#!/usr/bin/env python3
"""Score for V020 "Why does this pop-up make you insult yourself?" (library reading nook, calm + playful).

90 BPM, 4/4 -> 1 bar = 2.667 s = 80 frames. 15 bars = 40 s. Sparse bed under the voice:
  bars 0-1   hook        B minor, sneaky pizzicato steps + soft clarinet sigh (the guilt-trip)
  bars 2-4   almost buy  Bm G A, pizz walks, side-stick ticks
  bars 5-6   the name    D major lifts, glockenspiel ping on the bar line
  bars 7-9   the rules   G D A, warmer: strings pad + upright bass, xylophone accents
  bars 10-12 click no    D G A D, light and happy (brush groove)
  bars 13-14 question + loop back to bar 0 (B minor again)
"""
import os

import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))
PIZZ, CLAR, BASS, GLOCK, STR, XYL, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {PIZZ: 45, CLAR: 71, BASS: 32, GLOCK: 9, STR: 49, XYL: 13}
events = []


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def bar(b):
    return b * BAR


E8 = TPB // 2
CH = {
    "Bm": (47, [59, 62, 66]),
    "G": (43, [59, 62, 67]),
    "A": (45, [57, 61, 64]),
    "D": (50, [57, 62, 66]),
    "Em": (52, [59, 64, 67]),
}


def pizz_bar(b, name, vel=56, busy=False):
    root, v = CH[name]
    s = bar(b)
    pat = [0, None, 1, None, 2, None, 1, None] if not busy else [0, 2, 1, None, 2, 0, 1, 2]
    for k, i in enumerate(pat):
        if i is not None:
            note(PIZZ, v[i], s + k * E8, E8, vel - (k % 2) * 8)
    note(BASS, root - 12, s, TPB * 2 - 40, 62)
    note(BASS, root - 12 + 7, s + 2 * TPB, TPB * 2 - 40, 52)


def tick_bar(b, vel=34):
    s = bar(b)
    for beat in (1, 3):
        note(DRUMS, 37, s + beat * TPB, E8, vel)


def brush_bar(b):
    s = bar(b)
    for k in range(8):
        note(DRUMS, 42, s + k * E8, E8, 30 if k % 2 else 40)
    note(DRUMS, 36, s, E8, 48)
    note(DRUMS, 37, s + TPB, E8, 36)
    note(DRUMS, 37, s + 3 * TPB, E8, 36)


def pad(b, name, n=1, vel=40):
    _, v = CH[name]
    for p in v:
        note(STR, p - 12, bar(b), BAR * n - 20, vel)


# hook + loop (bars 0-1 and 13-14 identical)
for b0 in (0, 13):
    pizz_bar(b0, "Bm")
    pizz_bar(b0 + 1, "G")
    note(CLAR, 66, bar(b0) + 3 * TPB, TPB * 2, 44)  # sigh F# -> E
    note(CLAR, 64, bar(b0 + 1) + TPB, TPB * 2, 40)
# almost buy
for i, n in enumerate(["Bm", "G", "A"]):
    pizz_bar(2 + i, n, 52)
    tick_bar(2 + i)
note(CLAR, 61, bar(4) + 2 * TPB, TPB * 2, 40)
# the name: lift to D
for i, n in enumerate(["D", "A"]):
    pizz_bar(5 + i, n, 58)
    pad(5 + i, n, vel=34)
note(GLOCK, 86, bar(5), TPB, 70)
note(GLOCK, 90, bar(5) + E8, TPB, 60)
# the rules
for i, n in enumerate(["G", "D", "A"]):
    pizz_bar(7 + i, n, 54)
    pad(7 + i, n, vel=40)
    note(XYL, CH[n][1][2] + 12, bar(7 + i), TPB, 56)
# click no: light groove
for i, n in enumerate(["D", "G", "A"]):
    pizz_bar(10 + i, n, 60, busy=True)
    brush_bar(10 + i)
note(GLOCK, 86, bar(11), TPB, 66)
note(CLAR, 74, bar(12) + 2 * TPB, TPB * 2, 46)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(90), time=0))
for ch, pg in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=pg, time=0))
    tr.append(mido.Message("control_change", channel=ch, control=91, value=50, time=0))
last = 0
for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
    tr.append(m.copy(time=t - last))
    last = t
mid.save(os.path.join(HERE, "v020-shame-button.mid"))
print("wrote v020-shame-button.mid")
