#!/usr/bin/env python3
"""Score for R32 "Skipping MSG? Before you do, does it cause headaches?" (Real Check #32).

E minor -> G major, 96 BPM: a light kitchen-lab bed (marimba off-beats, celesta sparkle, soft string pad, fretless
bass) with steel-drum ticks in the gaps between lines, silence before the verdict (15.40-15.90 s), orchestra hit +
taiko + glockenspiel on "Myth" (15.90 s), then a marimba tag that resolves to G for the loop.
"""
import os

import mido

TPB = 480
BPM = 96
HERE = os.path.dirname(os.path.abspath(__file__))
MAR, BASS, PAD, TICK, CEL, HITC, TAIKO, GLOCK = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {MAR: 12, BASS: 35, PAD: 49, TICK: 114, CEL: 8, HITC: 55, TAIKO: 116, GLOCK: 9}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# Em - C - G - D
CH = [([59, 64, 67], 40), ([60, 64, 67], 36), ([59, 62, 67], 43), ([57, 62, 66], 38)]
DROP0, HIT, END = 15.40, 15.90, 24.90

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

# steel-drum ticks in the gaps between lines
for g in (3.85, 7.5, 10.65, 13.15):
    note(TICK, 76, g, 0.1, 28)
    note(TICK, 81, g + 0.15, 0.12, 22)

note(HITC, 64, HIT, 0.9, 98)
note(TAIKO, 40, HIT, 1.2, 118)
note(TAIKO, 36, HIT + 0.03, 1.0, 92)
note(GLOCK, 79, HIT, 1.6, 66)
for p in (55, 59, 62, 67):
    note(PAD, p, HIT, 2.2, 24)

x = HIT + 1.3
for voic, root in [CH[2], CH[1], CH[3], CH[2], CH[1], CH[3], CH[2]]:
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
out = os.path.join(HERE, "r32-msg-headache.mid")
mid.save(out)
print("wrote", out)
