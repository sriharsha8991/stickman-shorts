#!/usr/bin/env python3
"""Score for R37 "Never restart your phone? Are you making hacking easier?" (Real Check #37).

E minor, 112 BPM: a cool "phone circuitry" bed (vibraphone sixteenth-note blips, warm synth pad, synth bass pulses)
with celesta "boot-up" chirps in the gaps between lines, silence before the verdict (14.7-15.2 s), orchestra hit +
timpani + tubular bell on "True" (15.2 s), then a rising vibraphone "reboot" tag that resolves to G major for the loop.
"""
import os

import mido

TPB = 480
BPM = 112
HERE = os.path.dirname(os.path.abspath(__file__))
VIB, BASS, PAD, CEL, HIT_CH, TIMP, BELL = 0, 1, 2, 3, 4, 5, 6
PROGRAMS = {VIB: 11, BASS: 38, PAD: 89, CEL: 8, HIT_CH: 55, TIMP: 47, BELL: 14}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
# Em - C - G - D
CH = [([64, 67, 71], 40), ([60, 64, 67], 36), ([55, 59, 62], 43), ([62, 66, 69], 38)]
DROP0, HIT, END = 14.7, 15.2, 23.2

s, b = 0.0, 0
while s < DROP0 - 0.05:
    voic, root = CH[b % 4]
    bar = 4 * BEAT
    for p in voic:
        note(PAD, p - 12, s, min(bar, DROP0 - s), 13)
    for k in range(4):
        x = s + k * BEAT
        if x >= DROP0 - 0.05:
            break
        note(BASS, root, x, BEAT * 0.3, 34 if k % 2 == 0 else 24)
        y = x + BEAT / 2
        if y < DROP0 - 0.05:
            note(VIB, voic[(k + b) % 3] + 12, y, BEAT * 0.3, 18)
    b += 1
    s += bar

# celesta boot-up chirps in the gaps between lines
for g in (3.7, 7.35, 10.35, 12.85):
    for j, p in enumerate((83, 88, 91)):
        note(CEL, p, g + j * 0.09, 0.12, 22 - j * 3)

note(HIT_CH, 64, HIT, 0.7, 92)
note(HIT_CH, 71, HIT, 0.7, 86)
note(TIMP, 40, HIT, 1.2, 110)
note(TIMP, 28, HIT + 0.03, 1.0, 84)
note(BELL, 76, HIT, 2.0, 64)
for p in (52, 59, 64, 67):
    note(PAD, p, HIT, 2.2, 20)

# rising "reboot" tag, resolving to G major
x = HIT + 1.3
for voic, root in [CH[1], CH[2], CH[3], CH[0], CH[1], CH[3], CH[2]]:
    for j, p in enumerate(voic):
        note(VIB, p + 12, x + j * 0.1, 0.4, 20)
    note(BASS, root, x, 0.6, 28)
    x += 1.1
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
out = os.path.join(HERE, "r37-restart-phone.mid")
mid.save(out)
print("wrote", out)
