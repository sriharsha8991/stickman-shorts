#!/usr/bin/env python3
"""Score for R30 "Frozen vegetables? Before you skip them, are they worse?" (Real Check #30).

E minor -> G major, 96 BPM: a cool, icy bed (marimba off-beats, harp plucks, string pad, fingered bass) with
glockenspiel ticks in the gaps between lines, silence before the verdict (15.17-15.67 s), brass hit + timpani +
crash-style bell on "Myth" (15.67 s), then a marimba tag that resolves to G for the loop.
"""


import os

import mido

TPB = 480
BPM = 96
HERE = os.path.dirname(os.path.abspath(__file__))
VIB, BASS, PAD, XYL, PIZZ, BRASS, TIMP, BELL = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {VIB: 12, BASS: 33, PAD: 49, XYL: 9, PIZZ: 46, BRASS: 57, TIMP: 47, BELL: 112}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# Em - C - G - D
CH = [([59, 64, 67], 40), ([60, 64, 67], 36), ([59, 62, 67], 43), ([57, 62, 66], 38)]
DROP0, HIT, END = 15.17, 15.67, 24.57

s, b = 0.0, 0
while s < DROP0 - 0.05:
    voic, root = CH[b % 4]
    bar = 4 * BEAT
    for p in voic:
        note(PAD, p, s, min(bar, DROP0 - s), 12)
    note(BASS, root, s, min(BEAT * 1.6, DROP0 - s), 44)
    note(BASS, root + 7, s + 2 * BEAT, min(BEAT * 1.4, max(0.05, DROP0 - s - 2 * BEAT)), 36) if s + 2 * BEAT < DROP0 - 0.05 else None
    for k in range(4):
        x = s + k * BEAT + BEAT / 2
        if x >= DROP0 - 0.05:
            break
        note(VIB, voic[k % 3] + 12, x, BEAT * 0.4, 22)
    for k in (0, 2):
        x = s + k * BEAT
        if x < DROP0 - 0.05:
            note(PIZZ, voic[(k // 2) % 3] + 12, x, BEAT * 0.3, 26)
    b += 1
    s += bar

# xylophone ticks (two quick dry notes) in the gaps between lines
for g in (3.85, 6.68, 9.2, 13.35):
    note(XYL, 88, g, 0.1, 30)
    note(XYL, 83, g + 0.16, 0.12, 24)

note(BRASS, 67, HIT, 0.8, 100)
note(BRASS, 74, HIT, 0.8, 92)
note(TIMP, 43, HIT, 1.3, 118)
note(TIMP, 38, HIT + 0.02, 1.0, 94)
note(BELL, 79, HIT, 1.6, 70)
for p in (67, 71, 74, 79):
    note(PAD, p, HIT, 2.0, 26)

x = HIT + 1.3
for voic, root in [CH[1], CH[3], CH[2], CH[1], CH[3], CH[2]]:
    for j, p in enumerate(voic):
        note(VIB, p + 12, x + j * 0.1, 0.5, 26)
    note(BASS, root, x, 0.8, 36)
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
out = os.path.join(HERE, "r30-frozen-veg.mid")
mid.save(out)
print("wrote", out)
