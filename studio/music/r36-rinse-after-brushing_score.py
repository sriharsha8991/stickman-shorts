#!/usr/bin/env python3
"""Score for R36 "Brushed your teeth? Before you rinse, does water ruin it?" (Real Check #36).

D major, 100 BPM: a clean "morning bathroom" bed (marimba off-beats, soft electric piano pad, pizzicato bass) with
glockenspiel water drips in the gaps between lines, silence before the verdict (15.45-15.97 s), orchestra hit +
timpani + tubular bell on "Half" (15.97 s), then a marimba tag that resolves to D major for the loop.
"""
import os

import mido

TPB = 480
BPM = 100
HERE = os.path.dirname(os.path.abspath(__file__))
MAR, BASS, PAD, GLOCK, HIT_CH, TIMP, BELL = 0, 1, 2, 3, 4, 5, 6
PROGRAMS = {MAR: 12, BASS: 45, PAD: 4, GLOCK: 9, HIT_CH: 55, TIMP: 47, BELL: 14}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# D - Bm - G - A
CH = [([62, 66, 69], 38), ([59, 62, 66], 35), ([55, 59, 62], 31), ([57, 61, 64], 33)]
DROP0, HIT, END = 15.45, 15.97, 24.6

s, b = 0.0, 0
while s < DROP0 - 0.05:
    voic, root = CH[b % 4]
    bar = 4 * BEAT
    for p in voic:
        note(PAD, p, s, min(bar, DROP0 - s), 12)
    note(BASS, root, s, BEAT * 0.5, 40)
    if s + 2 * BEAT < DROP0 - 0.05:
        note(BASS, root + 7, s + 2 * BEAT, BEAT * 0.5, 30)
    for k in range(4):
        x = s + k * BEAT + BEAT / 2
        if x >= DROP0 - 0.05:
            break
        note(MAR, voic[(k + b) % 3] + 12, x, BEAT * 0.35, 20)
    b += 1
    s += bar

# glockenspiel water drips in the gaps between lines
for g in (3.65, 7.55, 11.2):
    note(GLOCK, 86, g, 0.15, 26)
    note(GLOCK, 81, g + 0.16, 0.15, 20)
    note(GLOCK, 78, g + 0.32, 0.2, 16)

note(HIT_CH, 62, HIT, 0.7, 92)
note(HIT_CH, 69, HIT, 0.7, 86)
note(TIMP, 38, HIT, 1.2, 110)
note(TIMP, 26, HIT + 0.03, 1.0, 84)
note(BELL, 74, HIT, 2.0, 64)
for p in (50, 57, 62, 66):
    note(PAD, p, HIT, 2.2, 20)

x = HIT + 1.3
for voic, root in [CH[2], CH[3], CH[1], CH[2], CH[3], CH[0], CH[0]]:
    for j, p in enumerate(voic):
        note(MAR, p + 12, x + j * 0.11, 0.4, 21)
    note(BASS, root, x, 0.6, 30)
    x += 1.2
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
out = os.path.join(HERE, "r36-rinse-after-brushing.mid")
mid.save(out)
print("wrote", out)
