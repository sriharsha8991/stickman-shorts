#!/usr/bin/env python3
"""Score for R19 "Dropped food? Before you eat it, is five seconds safe?" (Real Check #19).

G major, 108 BPM: a bouncy picnic bed (xylophone, steel-string guitar, finger bass, warm pad) under the voice, kalimba
"tick-tock" plinks in the gaps, silence before the verdict (15.35-15.85 s), orchestra hit + timpani + glockenspiel on
"myth!" (15.87 s), then a xylophone tag that resolves to G for the loop.
"""
import os

import mido

TPB = 480
BPM = 108
HERE = os.path.dirname(os.path.abspath(__file__))
MAR, PIZZ, BASS, BOX, GLOCK, HITC, TIMP, PAD = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {MAR: 13, PIZZ: 25, BASS: 33, BOX: 108, GLOCK: 9, HITC: 55, TIMP: 47, PAD: 89}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
CH = [("G", 43, [59, 62, 67]), ("Em", 40, [59, 64, 67]), ("C", 36, [60, 64, 67]), ("D", 38, [57, 62, 66])]
DROP0, HIT, END = 15.35, 15.87, 24.8

s, b = 0.0, 0
while s < DROP0 - 0.05:
    name, root, voic = CH[b % 4]
    bar = 4 * BEAT
    dur = min(bar, DROP0 - s)
    for p in voic:
        note(PAD, p, s, dur, 22)
    for beat in range(4):
        x = s + beat * BEAT
        if x >= DROP0 - 0.05:
            break
        note(BASS, root, x, BEAT * 0.45, 48 if beat in (0, 2) else 34)
        note(PIZZ, voic[(beat + 1) % 3] + 12, x + BEAT / 2, BEAT * 0.3, 30)
        if beat % 2 == 1:
            note(MAR, voic[beat % 3] + 12, x, BEAT * 0.3, 32)
    b += 1
    s += bar

# tick-tock plinks in the gaps between lines
for g, notes in [(3.55, [79, 74]), (7.05, [79, 74]), (10.6, [81, 76]), (13.4, [83, 79])]:
    for i, p in enumerate(notes):
        note(BOX, p, g + i * 0.18, 0.3, 50)
# falling marimba run into the drop
for k, p in enumerate([83, 81, 79, 78, 76, 74, 71]):
    note(MAR, p, 14.4 + k * 0.13, 0.12, 38 + k * 4)

note(HITC, 67, HIT, 0.9, 110)
note(HITC, 55, HIT, 0.9, 100)
note(TIMP, 43, HIT, 1.3, 118)
note(TIMP, 50, HIT + 0.02, 1.0, 96)
for i, p in enumerate((91, 95, 98, 103)):
    note(GLOCK, p, HIT + i * 0.1, 0.8, 88)
for p in (55, 59, 62, 67):
    note(PAD, p, HIT, 2.0, 38)

x = HIT + 1.6
for name, root, voic in [CH[2], CH[3], CH[1], CH[3], CH[0], CH[0]]:
    for j, p in enumerate(voic):
        note(MAR, p + 12, x + j * 0.07, 0.4, 34)
    note(BASS, root, x, 0.7, 42)
    x += 1.2

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
out = os.path.join(HERE, "r19-five-second.mid")
mid.save(out)
print("wrote", out)
