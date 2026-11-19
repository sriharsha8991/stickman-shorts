#!/usr/bin/env python3
"""Score for R35 "Wet hair? Before you step out, will you catch cold?" (Real Check #35).

A minor, 84 BPM: a wintry "frosty window" bed (music-box arpeggio, harp, soft string pad, pizzicato bass) with
triangle shivers in the gaps between lines, silence before the verdict (15.00-15.50 s), brass stab + timpani +
tubular bell on "Half" (15.50 s), then a music-box tag that resolves to A minor for the loop.
"""
import os

import mido

TPB = 480
BPM = 84
HERE = os.path.dirname(os.path.abspath(__file__))
BOX, BASS, PAD, TRI, HARP, BRASS, TIMP, BELL = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {BOX: 10, BASS: 45, PAD: 49, TRI: 112, HARP: 46, BRASS: 61, TIMP: 47, BELL: 14}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# Am - F - C - G
CH = [([69, 72, 76], 45), ([65, 69, 72], 41), ([64, 67, 72], 48), ([62, 67, 71], 43)]
DROP0, HIT, END = 15.00, 15.50, 24.15

s, b = 0.0, 0
while s < DROP0 - 0.05:
    voic, root = CH[b % 4]
    bar = 4 * BEAT
    for p in voic:
        note(PAD, p - 12, s, min(bar, DROP0 - s), 10)
    note(BASS, root, s, BEAT * 0.5, 40)
    if s + 2 * BEAT < DROP0 - 0.05:
        note(BASS, root + 7, s + 2 * BEAT, BEAT * 0.5, 32)
    for k in range(4):
        x = s + k * BEAT + BEAT / 2
        if x >= DROP0 - 0.05:
            break
        note(BOX, voic[(k * 2 + b) % 3] + 12, x, BEAT * 0.4, 19)
    note(HARP, voic[0] - 12, s, BEAT, 18)
    b += 1
    s += bar

# triangle shivers in the gaps between lines
for g in (3.25, 7.25, 10.6):
    note(TRI, 81, g, 0.12, 24)
    note(TRI, 81, g + 0.12, 0.12, 18)

note(BRASS, 57, HIT, 0.8, 96)
note(BRASS, 64, HIT, 0.8, 90)
note(TIMP, 45, HIT, 1.2, 110)
note(TIMP, 33, HIT + 0.03, 1.0, 86)
note(BELL, 81, HIT, 2.0, 66)
for p in (45, 52, 57, 60):
    note(PAD, p, HIT, 2.2, 22)

x = HIT + 1.3
for voic, root in [CH[1], CH[2], CH[3], CH[1], CH[2], CH[0], CH[0]]:
    for j, p in enumerate(voic):
        note(BOX, p + 12, x + j * 0.12, 0.45, 22)
    note(BASS, root, x, 0.6, 32)
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
out = os.path.join(HERE, "r35-wet-hair-cold.mid")
mid.save(out)
print("wrote", out)
