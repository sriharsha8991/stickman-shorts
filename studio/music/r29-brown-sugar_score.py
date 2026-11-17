#!/usr/bin/env python3
"""Score for R29 "Brown sugar? Before you pay more, is it healthier?" (Real Check #29).

F major, 84 BPM: a warm kitchen bed (celesta off-beats, pizzicato strings, clarinet pad, acoustic bass) with
woodblock ticks in the gaps between lines, silence before the verdict (15.13-15.63 s), brass hit + timpani +
tubular bell on "Myth" (15.63 s), then a celesta tag that resolves to F for the loop.
"""


import os

import mido

TPB = 480
BPM = 84
HERE = os.path.dirname(os.path.abspath(__file__))
VIB, BASS, PAD, XYL, PIZZ, BRASS, TIMP, BELL = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {VIB: 8, BASS: 32, PAD: 71, XYL: 115, PIZZ: 45, BRASS: 61, TIMP: 47, BELL: 14}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# F - Dm - Bb - C
CH = [([60, 65, 69], 41), ([62, 65, 69], 38), ([62, 65, 70], 46), ([60, 64, 67], 48)]
DROP0, HIT, END = 15.13, 15.63, 23.57

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
for g in (3.4, 6.45, 9.1):
    note(XYL, 77, g, 0.1, 34)
    note(XYL, 72, g + 0.16, 0.12, 28)

note(BRASS, 65, HIT, 0.8, 100)
note(BRASS, 72, HIT, 0.8, 92)
note(TIMP, 41, HIT, 1.3, 118)
note(TIMP, 36, HIT + 0.02, 1.0, 94)
note(BELL, 77, HIT, 1.6, 80)
for p in (65, 69, 72, 77):
    note(PAD, p, HIT, 2.0, 26)

x = HIT + 1.3
for voic, root in [CH[1], CH[2], CH[3], CH[1], CH[2], CH[0]]:
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
out = os.path.join(HERE, "r29-brown-sugar.mid")
mid.save(out)
print("wrote", out)
