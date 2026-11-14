#!/usr/bin/env python3
"""Score for R20 "Raw chicken? Before you wash it, is it safer?" (Real Check #20).

B-flat major, 96 BPM: a light kitchen bed (nylon guitar, celesta, upright bass, soft string pad) under the voice,
water-drip woodblock plinks in the gaps, silence before the verdict (15.35-15.85 s), brass stab + timpani + tubular
bell on "myth!" (15.87 s), then a celesta tag that resolves to B-flat for the loop.
"""
import os

import mido

TPB = 480
BPM = 96
HERE = os.path.dirname(os.path.abspath(__file__))
GTR, CEL, BASS, DRIP, BELL, BRASS, TIMP, PAD = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {GTR: 24, CEL: 8, BASS: 32, DRIP: 115, BELL: 14, BRASS: 61, TIMP: 47, PAD: 49}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
CH = [("Bb", 46, [58, 62, 65]), ("Gm", 43, [58, 62, 67]), ("Eb", 39, [58, 63, 67]), ("F", 41, [57, 60, 65])]
DROP0, HIT, END = 15.35, 15.87, 25.1

s, b = 0.0, 0
while s < DROP0 - 0.05:
    name, root, voic = CH[b % 4]
    bar = 4 * BEAT
    dur = min(bar, DROP0 - s)
    for p in voic:
        note(PAD, p, s, dur, 20)
    for beat in range(4):
        x = s + beat * BEAT
        if x >= DROP0 - 0.05:
            break
        note(BASS, root, x, BEAT * 0.6, 46 if beat in (0, 2) else 32)
        note(GTR, voic[beat % 3], x + BEAT / 2, BEAT * 0.4, 30)
    b += 1
    s += bar

# water drips in the gaps between lines
for g in (3.3, 8.0, 10.75, 13.3):
    for i, p in enumerate((84, 79)):
        note(DRIP, p, g + i * 0.2, 0.2, 52)
# rising celesta into the drop
for k, p in enumerate([70, 72, 74, 75, 77, 79, 82]):
    note(CEL, p, 14.3 + k * 0.14, 0.12, 36 + k * 4)

note(BRASS, 58, HIT, 0.8, 108)
note(BRASS, 65, HIT, 0.8, 100)
note(TIMP, 46, HIT, 1.3, 118)
note(TIMP, 41, HIT + 0.02, 1.0, 94)
note(BELL, 82, HIT, 1.5, 84)
for p in (58, 62, 65, 70):
    note(PAD, p, HIT, 2.0, 36)

x = HIT + 1.5
for name, root, voic in [CH[2], CH[3], CH[1], CH[3], CH[0], CH[0]]:
    for j, p in enumerate(voic):
        note(CEL, p + 12, x + j * 0.08, 0.4, 32)
    note(BASS, root, x, 0.8, 40)
    x += 1.25

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
out = os.path.join(HERE, "r20-wash-chicken.mid")
mid.save(out)
print("wrote", out)
