#!/usr/bin/env python3
"""Score for R22 "Blue-light glasses? Before you buy, do they work? Why?" (Real Check #22).

Eb major, 84 BPM: a calm screen-glow bed (electric piano, synth-string pad, fretless bass, soft harp arpeggio) with
celesta glints in the gaps between lines, silence before the verdict (14.77-15.27 s), brass + timpani + tubular-bell
hit on "myth!" (15.27 s), then an electric-piano tag that resolves to Eb for the loop.
"""
import os

import mido

TPB = 480
BPM = 84
HERE = os.path.dirname(os.path.abspath(__file__))
EP, BASS, PAD, CEL, HARP, BRASS, TIMP, BELL = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {EP: 4, BASS: 35, PAD: 50, CEL: 8, HARP: 46, BRASS: 61, TIMP: 47, BELL: 14}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# Eb - Cm - Ab - Bb
CH = [([63, 67, 70], 39), ([60, 63, 67], 36), ([60, 63, 68], 44), ([62, 65, 70], 46)]
DROP0, HIT, END = 14.77, 15.27, 25.13

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
for g in (3.75, 6.88, 9.58, 12.82):
    for i, p in enumerate((87, 91, 94)):
        note(CEL, p, g + i * 0.11, 0.2, 34)

note(BRASS, 63, HIT, 0.8, 108)
note(BRASS, 70, HIT, 0.8, 100)
note(TIMP, 51, HIT, 1.3, 118)
note(TIMP, 46, HIT + 0.02, 1.0, 94)
note(BELL, 75, HIT, 1.6, 80)
for p in (63, 67, 70, 75):
    note(PAD, p, HIT, 2.0, 32)

x = HIT + 1.4
for voic, root in [CH[2], CH[3], CH[1], CH[3], CH[0], CH[0]]:
    for j, p in enumerate(voic):
        note(EP, p + 12, x + j * 0.1, 0.5, 28)
    note(BASS, root, x, 0.8, 38)
    x += 1.4

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
out = os.path.join(HERE, "r22-blue-light-glasses.mid")
mid.save(out)
print("wrote", out)
