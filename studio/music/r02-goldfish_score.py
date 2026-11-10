#!/usr/bin/env python3
"""Score for R02 "Does your goldfish forget you, before you even turn around?" (Real Check #2).

G major, 100 BPM: a light "aquarium" bed (marimba, vibraphone pad, pizzicato bass) under the voice, little rising
flute "bubble" figures in the gaps, silence before the verdict (21.6-22.13 s), timpani + brass + glockenspiel hit on
"myth!" (22.13 s), then a soft vibraphone tag that resolves back to the opening chord for the loop. Times in seconds.
"""
import os

import mido

TPB = 480
BPM = 100
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, PAD, BASS, CELESTA, GLOCK, BRASS, TIMP, STR = 0, 1, 2, 3, 4, 6, 7, 5
PROGRAMS = {PIANO: 12, PAD: 11, BASS: 45, CELESTA: 73, GLOCK: 9, BRASS: 61, TIMP: 47, STR: 48}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
CH = [("G", 43, [59, 62, 67]), ("Em", 40, [59, 64, 67]), ("C", 36, [60, 64, 67]), ("D", 38, [57, 62, 66])]
DROP0, HIT, END = 21.6, 22.13, 30.6

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

for g, notes in [(3.8, [74, 79, 83]), (7.8, [79, 83, 86]), (11.8, [74, 76, 79, 83]), (15.5, [81, 83, 86]), (19.2, [79, 81, 83])]:
    for i, p in enumerate(notes):
        note(CELESTA, p, g + i * 0.16, 0.35, 52)

# a held string swell into the drop
note(STR, 62, 18.2, 3.3, 40)
note(STR, 69, 18.2, 3.3, 36)

note(TIMP, 43, HIT, 1.3, 118)
note(TIMP, 50, HIT + 0.02, 1.1, 100)
for p in (55, 59, 62, 67, 71, 74):
    note(BRASS, p, HIT, 1.5, 100)
for i, p in enumerate((86, 91, 95, 98)):
    note(GLOCK, p, HIT + i * 0.1, 0.8, 90)
for p in (59, 62, 67):
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
out = os.path.join(HERE, "r02-goldfish.mid")
mid.save(out)
print("wrote", out)
