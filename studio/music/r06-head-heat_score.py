#!/usr/bin/env python3
"""Score for R06 "Before grabbing a hat, does your head lose most heat?" (Real Check #6).

A minor, 88 BPM: a frosty winter bed (string pad, vibraphone, fingered bass) under the voice, sleigh-bell-like celesta
sparkles in the gaps, a breathy flute line on the cold-water lines, silence before the verdict (14.72-15.20 s),
timpani + brass + glockenspiel hit on "myth!" (15.23 s), then a vibraphone tag that resolves to A minor for the loop.
"""
import os

import mido

TPB = 480
BPM = 88
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, PAD, BASS, CELESTA, GLOCK, BRASS, TIMP, STR = 0, 1, 2, 3, 4, 6, 7, 5
PROGRAMS = {PIANO: 11, PAD: 49, BASS: 33, CELESTA: 8, GLOCK: 9, BRASS: 61, TIMP: 47, STR: 73}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
CH = [("Am", 45, [57, 60, 64]), ("F", 41, [57, 60, 65]), ("C", 48, [55, 60, 64]), ("G", 43, [55, 59, 62])]
DROP0, HIT, END = 14.72, 15.23, 23.5

s, b = 0.0, 0
while s < DROP0 - 0.05:
    name, root, voic = CH[b % 4]
    bar = 4 * BEAT
    dur = min(bar, DROP0 - s)
    for p in voic:
        note(PAD, p, s, dur, 26)
    for beat in range(4):
        x = s + beat * BEAT
        if x >= DROP0 - 0.05:
            break
        note(BASS, root, x, BEAT * 0.5, 50 if beat == 0 else 36)
        note(PIANO, voic[beat % 3] + 12, x + BEAT / 2, BEAT * 0.4, 30)
    b += 1
    s += bar

for g, notes in [(3.35, [76, 81, 84]), (6.5, [77, 81, 84]), (9.7, [76, 79, 84]), (12.65, [74, 79, 83])]:
    for i, p in enumerate(notes):
        note(CELESTA, p, g + i * 0.16, 0.35, 52)

# breathy flute (long notes) on the cold-water lines, soft under the voice
for k, p in enumerate([69, 72, 71, 67, 69, 64, 65, 67]):
    x = 4.0 + k * BEAT * 2
    if x < 12.4:
        note(STR, p, x, BEAT * 1.6, 26)
# rising vibraphone run into the drop
for k, p in enumerate([64, 67, 69, 71, 72, 74, 76]):
    note(PIANO, p, 13.7 + k * 0.14, 0.12, 40 + k * 4)

note(TIMP, 45, HIT, 1.3, 118)
note(TIMP, 40, HIT + 0.02, 1.1, 100)
for p in (57, 64, 69, 72, 76, 81):
    note(BRASS, p, HIT, 1.5, 100)
for i, p in enumerate((81, 84, 88, 93)):
    note(GLOCK, p, HIT + i * 0.1, 0.8, 90)
for p in (57, 60, 64):
    note(PAD, p, HIT, 2.2, 40)

x = HIT + 1.8
for name, root, voic in [CH[1], CH[2], CH[3], CH[1], CH[3], CH[0]]:
    for j, p in enumerate(voic):
        note(PIANO, p + 12, x + j * 0.06, 0.5, 36)
    note(BASS, root, x, 0.8, 44)
    x += 1.15

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
out = os.path.join(HERE, "r06-head-heat.mid")
mid.save(out)
print("wrote", out)
