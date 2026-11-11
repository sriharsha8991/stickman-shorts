#!/usr/bin/env python3
"""Score for R05 "Before you blame the sugar, are your kids hyper? Why?" (Real Check #5).

F major, 112 BPM: a light "party table" bed (marimba, pizzicato strings, acoustic bass) under the voice, music-box
sparkles in the gaps, a tiptoe clarinet line on the blind-test lines, silence before the verdict (15.45-15.95 s),
timpani + brass + glockenspiel hit on "myth!" (15.97 s), then a marimba tag that resolves to F major for the loop.
"""
import os

import mido

TPB = 480
BPM = 112
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, PAD, BASS, CELESTA, GLOCK, BRASS, TIMP, STR = 0, 1, 2, 3, 4, 6, 7, 5
PROGRAMS = {PIANO: 12, PAD: 89, BASS: 32, CELESTA: 10, GLOCK: 9, BRASS: 61, TIMP: 47, STR: 71}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
CH = [("F", 41, [57, 60, 65]), ("Dm", 38, [57, 62, 65]), ("Bb", 46, [58, 62, 65]), ("C", 48, [55, 60, 64])]
DROP0, HIT, END = 15.45, 15.97, 24.5

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

for g, notes in [(3.65, [77, 81, 84]), (6.85, [81, 84, 89]), (10.95, [77, 82, 86]), (13.9, [79, 84, 88])]:
    for i, p in enumerate(notes):
        note(CELESTA, p, g + i * 0.16, 0.35, 52)

# tiptoe clarinet (staccato) on the blind-test lines, soft under the voice
for k, p in enumerate([65, 67, 69, 67, 65, 64, 62, 64, 65, 69, 72, 70, 69, 67]):
    x = 4.2 + k * BEAT * 1.5
    if x < 11.4:
        note(STR, p, x, BEAT * 0.35, 30)
# rising pizz-style marimba run into the drop
for k, p in enumerate([65, 67, 69, 70, 72, 74, 76]):
    note(PIANO, p, 14.4 + k * 0.14, 0.12, 40 + k * 4)

note(TIMP, 41, HIT, 1.3, 118)
note(TIMP, 48, HIT + 0.02, 1.1, 100)
for p in (53, 60, 65, 69, 72, 77):
    note(BRASS, p, HIT, 1.5, 100)
for i, p in enumerate((84, 89, 93, 96)):
    note(GLOCK, p, HIT + i * 0.1, 0.8, 90)
for p in (57, 60, 65):
    note(PAD, p, HIT, 2.2, 40)

x = HIT + 1.8
for name, root, voic in [CH[2], CH[3], CH[1], CH[2], CH[3], CH[0]]:
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
out = os.path.join(HERE, "r05-sugar-hyper.mid")
mid.save(out)
print("wrote", out)
