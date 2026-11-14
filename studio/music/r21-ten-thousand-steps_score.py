#!/usr/bin/env python3
"""Score for R21 "Ten thousand steps? Before you walk, do you need them?" (Real Check #21).

C major, 104 BPM: a walking bed (pizzicato walking bass, vibraphone off-beats, warm pad) with soft woodblock
footsteps in the gaps between lines, silence before the verdict (15.43-15.93 s), brass + timpani + glockenspiel
hit on "myth!" (15.93 s), then a vibraphone tag that resolves to C for the loop.
"""
import os

import mido

TPB = 480
BPM = 104
HERE = os.path.dirname(os.path.abspath(__file__))
VIB, BASS, PAD, STEP, GLOCK, BRASS, TIMP, CLAR = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {VIB: 11, BASS: 45, PAD: 89, STEP: 115, GLOCK: 9, BRASS: 61, TIMP: 47, CLAR: 71}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# C - Am - F - G, walking bass lines (4 quarter notes per bar)
CH = [([60, 64, 67], [36, 40, 43, 45]), ([60, 64, 69], [45, 43, 40, 38]),
      ([60, 65, 69], [41, 43, 45, 47]), ([59, 62, 67], [43, 41, 40, 38])]
DROP0, HIT, END = 15.43, 15.93, 24.34

s, b = 0.0, 0
while s < DROP0 - 0.05:
    voic, walk = CH[b % 4]
    bar = 4 * BEAT
    for p in voic:
        note(PAD, p, s, min(bar, DROP0 - s), 18)
    for beat in range(4):
        x = s + beat * BEAT
        if x >= DROP0 - 0.05:
            break
        note(BASS, walk[beat], x, BEAT * 0.5, 50 if beat in (0, 2) else 38)
        note(VIB, voic[(beat + 1) % 3] + 12, x + BEAT / 2, BEAT * 0.4, 26)
    b += 1
    s += bar

# soft footsteps in the gaps between lines
for g in (3.35, 6.22, 9.39):
    for i, p in enumerate((77, 76, 77)):
        note(STEP, p, g + i * 0.16, 0.12, 40)
# rising clarinet into the drop
for k, p in enumerate([67, 69, 71, 72, 74, 76]):
    note(CLAR, p, 14.35 + k * 0.16, 0.14, 38 + k * 4)

note(BRASS, 60, HIT, 0.8, 108)
note(BRASS, 67, HIT, 0.8, 100)
note(TIMP, 48, HIT, 1.3, 118)
note(TIMP, 43, HIT + 0.02, 1.0, 94)
note(GLOCK, 84, HIT, 1.2, 84)
for p in (60, 64, 67, 72):
    note(PAD, p, HIT, 2.0, 34)

x = HIT + 1.4
for voic, walk in [CH[2], CH[3], CH[1], CH[3], CH[0], CH[0]]:
    for j, p in enumerate(voic):
        note(VIB, p + 12, x + j * 0.09, 0.45, 30)
    note(BASS, walk[0], x, 0.7, 40)
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
out = os.path.join(HERE, "r21-ten-thousand-steps.mid")
mid.save(out)
print("wrote", out)
