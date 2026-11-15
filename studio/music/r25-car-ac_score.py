#!/usr/bin/env python3
"""Score for R25 "Does your AC cost you more fuel than open windows?" (Real Check #25).

D major, 96 BPM: a light road-trip bed (clean electric guitar arpeggio, warm synth pad, fingered bass, vibraphone)
with vibraphone glints in the gaps between lines, silence before the verdict (15.40-15.90 s), brass + timpani +
tubular-bell hit on "Half" (15.90 s), then a vibraphone tag that resolves to D for the loop.
"""

import os

import mido

TPB = 480
BPM = 96
HERE = os.path.dirname(os.path.abspath(__file__))
EP, BASS, PAD, CEL, HARP, BRASS, TIMP, BELL = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {EP: 11, BASS: 33, PAD: 89, CEL: 11, HARP: 27, BRASS: 61, TIMP: 47, BELL: 14}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# D - Bm - G - A
CH = [([62, 66, 69], 38), ([62, 66, 71], 35), ([62, 67, 71], 43), ([61, 64, 69], 45)]
DROP0, HIT, END = 15.40, 15.90, 24.8

s, b = 0.0, 0
while s < DROP0 - 0.05:
    voic, root = CH[b % 4]
    bar = 4 * BEAT
    for p in voic:
        note(PAD, p, s, min(bar, DROP0 - s), 16)
    note(BASS, root, s, min(bar * 0.9, DROP0 - s), 46)
    for k in range(8):
        x = s + k * BEAT / 2
        if x >= DROP0 - 0.05:
            break
        note(HARP, voic[k % 3] + (12 if k >= 4 else 0), x, BEAT * 0.45, 24)
    note(EP, voic[0] + 12, s + BEAT, BEAT * 0.8, 22)
    note(EP, voic[2] + 12, s + 3 * BEAT, BEAT * 0.8, 20)
    b += 1
    s += bar

# celesta glints (light) in the gaps between lines
for g in (3.6, 7.45, 10.95, 13.6):
    for i, p in enumerate((78, 81, 86)):
        note(CEL, p, g + i * 0.11, 0.2, 34)

note(BRASS, 50, HIT, 0.8, 108)
note(BRASS, 57, HIT, 0.8, 100)
note(TIMP, 38, HIT, 1.3, 118)
note(TIMP, 33, HIT + 0.02, 1.0, 94)
note(BELL, 74, HIT, 1.6, 80)
for p in (50, 54, 57, 62):
    note(PAD, p, HIT, 2.0, 32)

x = HIT + 1.3
for voic, root in [CH[2], CH[3], CH[1], CH[3], CH[0]]:
    for j, p in enumerate(voic):
        note(EP, p + 12, x + j * 0.1, 0.5, 28)
    note(BASS, root, x, 0.8, 38)
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
out = os.path.join(HERE, "r25-car-ac.mid")
mid.save(out)
print("wrote", out)
