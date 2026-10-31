#!/usr/bin/env python3
"""Score for V106 "Why do you hear your name in a noisy room?" (night garden party -> listening lab -> party).

108 BPM, 4/4 -> 1 bar = 2.222 s = 66.7 frames. 19 bars = 42.2 s. Sparse bed under the voice:
  bars 0-5   party       Eb major lounge: soft Rhodes comp (off-beat), walking upright bass, brushes,
                         a muted-trumpet two-note "call" on bar 5 (someone says your name)
  bars 6-14  lab         quiet and clean: harp arpeggios + celesta pings, no drums; Cm Ab Bb Eb;
                         bar 9 drop (only a held pad) before "one in three", celesta lift on bar 10
  bars 15-18 party again Eb Ab Bb Eb lounge groove returns, trumpet call answered; ends on Eb (loops to bar 0)
"""
import os

import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))
EP, BASS, TPT, HARP, CEL, PAD, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {EP: 4, BASS: 32, TPT: 59, HARP: 46, CEL: 8, PAD: 89}
events = []


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def bar(b):
    return b * BAR


E8 = TPB // 2
CH = {
    "Eb": (51, [55, 58, 62, 63]),
    "Cm": (48, [55, 58, 60, 63]),
    "Ab": (44, [56, 60, 63, 67]),
    "Bb": (46, [53, 58, 62, 65]),
    "Fm": (53, [56, 60, 63, 65]),
}


def lounge_bar(b, name, vel=46):
    root, v = CH[name]
    s = bar(b)
    for beat in (1, 3):  # off-beat Rhodes stabs ("and" of 1 and 3)
        for p in v:
            note(EP, p, s + beat * TPB - E8, E8 + 60, vel)
    walk = [root - 12, root - 12 + 4, root - 12 + 7, root - 12 + 9]
    for k, p in enumerate(walk):
        note(BASS, p, s + k * TPB, TPB - 30, 60 - 4 * (k % 2))
    for k in range(4):
        note(DRUMS, 42 if k % 2 else 51, s + k * TPB, E8, 26 if k % 2 else 32)
    note(DRUMS, 37, s + 1 * TPB, E8, 26)
    note(DRUMS, 37, s + 3 * TPB, E8, 26)


def harp_bar(b, name, vel=44):
    root, v = CH[name]
    s = bar(b)
    seq = [v[0], v[1], v[2], v[3], v[2], v[1]]
    for k, p in enumerate(seq):
        note(HARP, p + 12, s + k * (TPB * 2 // 3), TPB, vel - (k % 3) * 4)
    note(BASS, root - 12, s, BAR - 60, 46)


def pad(b, name, n=1, vel=30):
    _, v = CH[name]
    for p in v[:3]:
        note(PAD, p, bar(b), BAR * n - 20, vel)


# party
for i, n in enumerate(["Eb", "Cm", "Ab", "Bb", "Eb", "Ab"]):
    lounge_bar(i, n, 44 if i < 5 else 40)
note(TPT, 70, bar(5) + 2 * TPB, TPB, 58)  # the call: Bb -> G
note(TPT, 67, bar(5) + 3 * TPB, TPB + 120, 54)
# lab
for i, n in enumerate(["Cm", "Ab", "Bb"]):
    harp_bar(6 + i, n)
    pad(6 + i, n)
pad(9, "Fm", vel=26)  # drop before the number
note(CEL, 84, bar(10), TPB, 64)
note(CEL, 91, bar(10) + E8, TPB, 58)
for i, n in enumerate(["Eb", "Cm", "Ab", "Bb"]):
    harp_bar(10 + i, n, 42)
    pad(10 + i, n, vel=28)
    note(CEL, CH[n][1][3] + 24, bar(10 + i) + 2 * TPB, TPB, 46)
pad(14, "Bb", vel=26)
# party again
for i, n in enumerate(["Eb", "Ab", "Bb", "Eb"]):
    lounge_bar(15 + i, n, 44)
note(TPT, 70, bar(16) + 2 * TPB, TPB, 56)  # the call, answered
note(TPT, 75, bar(16) + 3 * TPB, TPB + 200, 52)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(108), time=0))
for ch, pg in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=pg, time=0))
    tr.append(mido.Message("control_change", channel=ch, control=91, value=50, time=0))
last = 0
for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
    tr.append(m.copy(time=t - last))
    last = t
mid.save(os.path.join(HERE, "v106-your-name.mid"))
print("wrote v106-your-name.mid")
