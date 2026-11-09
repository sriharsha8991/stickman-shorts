#!/usr/bin/env python3
"""Score for R01 "Can you see the Great Wall of China from space?" (Real Check #1).

D minor, 84 BPM: a calm "orbit" bed (warm pad, felt piano, soft pulse bass) under the voice, a celesta figure in a few
gaps, silence for the pause before the verdict (20.6-21.4 s), timpani + brass + glockenspiel hit on "myth!" (21.4 s),
then a soft piano tag that resolves back to the opening chord for the loop. Times in seconds.
"""
import os

import mido

TPB = 480
BPM = 84
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, PAD, BASS, CELESTA, GLOCK, BRASS, TIMP, STR = 0, 1, 2, 3, 4, 6, 7, 5
PROGRAMS = {PIANO: 0, PAD: 91, BASS: 33, CELESTA: 8, GLOCK: 9, BRASS: 61, TIMP: 47, STR: 49}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
CH = [("Dm", 38, [57, 62, 65]), ("Bb", 34, [58, 62, 65]), ("F", 41, [57, 60, 65]), ("C", 36, [55, 60, 64])]
DROP0, HIT, END = 20.6, 21.4, 30.1

s, b = 0.0, 0
while s < DROP0 - 0.05:
    name, root, voic = CH[b % 4]
    bar = 4 * BEAT
    dur = min(bar, DROP0 - s)
    for p in voic:
        note(PAD, p, s, dur, 34)
    for beat in range(4):
        x = s + beat * BEAT
        if x >= DROP0 - 0.05:
            break
        note(BASS, root, x, BEAT * 0.5, 50 if beat == 0 else 36)
        if beat in (0, 2):
            note(PIANO, voic[(beat // 2) % 3] + 12, x + BEAT / 2, BEAT * 0.8, 34)
    b += 1
    s += bar

for g, notes in [(2.9, [74, 77, 81]), (6.4, [81, 79, 77]), (9.4, [74, 76, 77, 81]), (13.0, [86, 84, 81]), (16.2, [77, 76, 74])]:
    for i, p in enumerate(notes):
        note(CELESTA, p, g + i * 0.16, 0.35, 52)

# a held string swell into the drop
note(STR, 62, 17.2, 3.3, 40)
note(STR, 69, 17.2, 3.3, 36)

note(TIMP, 38, HIT, 1.3, 118)
note(TIMP, 45, HIT + 0.02, 1.1, 100)
for p in (50, 57, 62, 65, 69, 74):
    note(BRASS, p, HIT, 1.5, 100)
for i, p in enumerate((86, 89, 93, 98)):
    note(GLOCK, p, HIT + i * 0.1, 0.8, 90)
for p in (57, 62, 65):
    note(PAD, p, HIT, 2.2, 46)

x = HIT + 2.0
for name, root, voic in [CH[1], CH[2], CH[3], CH[0]]:
    for j, p in enumerate(voic):
        note(PIANO, p, x + j * 0.02, 1.6, 40)
    note(BASS, root, x, 1.0, 46)
    x += 1.65

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
out = os.path.join(HERE, "r01-great-wall.mid")
mid.save(out)
print("wrote", out)
