#!/usr/bin/env python3
"""Score for R34 "Empty charger? Before you unplug it, is it costing you?" (Real Check #34).

Eb major, 94 BPM: a calm "humming socket" bed (electric-piano off-beats, clean-guitar sparkle, string pad, fingered
bass) with woodblock ticks in the gaps between lines, silence before the verdict (15.20-15.70 s), orchestra hit +
timpani + glockenspiel on "Myth" (15.70 s), then an electric-piano tag that resolves to Eb for the loop.
"""
import os

import mido

TPB = 480
BPM = 94
HERE = os.path.dirname(os.path.abspath(__file__))
MAR, BASS, PAD, TICK, CEL, HITC, TAIKO, GLOCK = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {MAR: 4, BASS: 33, PAD: 49, TICK: 115, CEL: 27, HITC: 55, TAIKO: 47, GLOCK: 9}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# Eb - Cm - Ab - Bb
CH = [([63, 67, 70], 39), ([63, 67, 72], 36), ([63, 68, 72], 44), ([62, 65, 70], 46)]
DROP0, HIT, END = 15.20, 15.70, 23.55

s, b = 0.0, 0
while s < DROP0 - 0.05:
    voic, root = CH[b % 4]
    bar = 4 * BEAT
    for p in voic:
        note(PAD, p - 12, s, min(bar, DROP0 - s), 11)
    note(BASS, root, s, min(BEAT * 1.8, DROP0 - s), 42)
    for k in range(4):
        x = s + k * BEAT + BEAT / 2
        if x >= DROP0 - 0.05:
            break
        note(MAR, voic[(k + b) % 3] + 12, x, BEAT * 0.35, 21)
    x = s + 3 * BEAT
    if x < DROP0 - 0.05:
        note(CEL, voic[2] + 24, x, BEAT * 0.5, 16)
    b += 1
    s += bar

# woodblock ticks in the gaps between lines
for g in (3.9, 7.65, 10.0):
    note(TICK, 76, g, 0.1, 28)
    note(TICK, 81, g + 0.15, 0.12, 22)

note(HITC, 63, HIT, 0.9, 98)
note(TAIKO, 39, HIT, 1.2, 112)
note(TAIKO, 34, HIT + 0.03, 1.0, 88)
note(GLOCK, 87, HIT, 1.8, 70)
for p in (51, 58, 63, 67):
    note(PAD, p, HIT, 2.2, 24)

x = HIT + 1.3
for voic, root in [CH[2], CH[3], CH[1], CH[2], CH[3], CH[0], CH[0]]:
    for j, p in enumerate(voic):
        note(MAR, p + 12, x + j * 0.11, 0.45, 24)
    note(BASS, root, x, 0.9, 34)
    x += 1.25
    if x > END - 0.6:
        break

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
for ch, prog in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
events.sort(key=lambda e: (e[0], e[1]))
last = 0
for tick, _, msg in events:
    tr.append(msg.copy(time=tick - last))
    last = tick
out = os.path.join(HERE, "r34-idle-charger.mid")
mid.save(out)
print("wrote", out)
