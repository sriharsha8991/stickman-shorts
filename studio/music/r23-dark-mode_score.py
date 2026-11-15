#!/usr/bin/env python3
"""Score for R23 "Dark mode? Before you trust it, does it save battery?" (Real Check #23).

A major, 92 BPM: a cool night-screen bed (vibraphone, warm synth pad, synth bass, soft pizzicato pulse) with
glockenspiel blips in the gaps between lines, silence before the verdict (15.23-15.73 s), brass + timpani + bell hit on
"half true!" (15.73 s), then a vibraphone tag that resolves to A for the loop.
"""

import os

import mido

TPB = 480
BPM = 92
HERE = os.path.dirname(os.path.abspath(__file__))
EP, BASS, PAD, CEL, HARP, BRASS, TIMP, BELL = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {EP: 11, BASS: 38, PAD: 89, CEL: 9, HARP: 45, BRASS: 61, TIMP: 47, BELL: 14}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# A - F#m - D - E
CH = [([61, 64, 69], 45), ([61, 66, 69], 42), ([62, 66, 69], 38), ([64, 68, 71], 40)]
DROP0, HIT, END = 15.23, 15.73, 24.4

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
for g in (3.6, 6.45, 10.15, 13.55):
    for i, p in enumerate((85, 88, 93)):
        note(CEL, p, g + i * 0.11, 0.2, 34)

note(BRASS, 57, HIT, 0.8, 108)
note(BRASS, 64, HIT, 0.8, 100)
note(TIMP, 45, HIT, 1.3, 118)
note(TIMP, 40, HIT + 0.02, 1.0, 94)
note(BELL, 81, HIT, 1.6, 80)
for p in (57, 61, 64, 69):
    note(PAD, p, HIT, 2.0, 32)

x = HIT + 1.3
for voic, root in [CH[2], CH[3], CH[1], CH[3], CH[0], CH[0]]:
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
out = os.path.join(HERE, "r23-dark-mode.mid")
mid.save(out)
print("wrote", out)
