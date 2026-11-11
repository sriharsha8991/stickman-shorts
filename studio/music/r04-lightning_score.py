#!/usr/bin/env python3
"""Score for R04 "Do you believe lightning never strikes one place twice? Why?" (Real Check #4).

E minor, 76 BPM: a dark "storm on the way" bed (tremolo strings, sweep pad, fretless bass) under the voice, soft
harp flickers in the gaps, a low timpani rumble like far thunder, silence before the verdict (15.4-15.9 s),
timpani + brass + glockenspiel hit on "myth!" (15.9 s), then a harp tag that resolves to E minor for the loop.
"""
import os

import mido

TPB = 480
BPM = 76
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, PAD, BASS, CELESTA, GLOCK, BRASS, TIMP, STR = 0, 1, 2, 3, 4, 6, 7, 5
PROGRAMS = {PIANO: 46, PAD: 95, BASS: 35, CELESTA: 46, GLOCK: 9, BRASS: 61, TIMP: 47, STR: 44}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
CH = [("Em", 40, [55, 59, 64]), ("C", 36, [55, 60, 64]), ("Am", 45, [57, 60, 64]), ("B", 47, [54, 59, 63])]
DROP0, HIT, END = 15.4, 15.9, 24.0

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

for g, notes in [(4.1, [76, 79, 83]), (8.75, [79, 83, 88]), (11.5, [76, 81, 84]), (14.1, [78, 83, 87])]:
    for i, p in enumerate(notes):
        note(CELESTA, p, g + i * 0.16, 0.35, 52)

# far thunder: soft low timpani rolls in the gaps
for r in (4.2, 9.0, 12.0):
    for k in range(6):
        note(TIMP, 40, r + k * 0.07, 0.12, 30 + k * 4)
# a held tremolo swell into the drop
for p in (52, 59, 64):
    note(STR, p, 12.6, DROP0 - 12.6, 42)

note(TIMP, 40, HIT, 1.3, 118)
note(TIMP, 47, HIT + 0.02, 1.1, 100)
for p in (52, 59, 64, 67, 71, 76):
    note(BRASS, p, HIT, 1.5, 100)
for i, p in enumerate((83, 88, 91, 95)):
    note(GLOCK, p, HIT + i * 0.1, 0.8, 90)
for p in (55, 59, 64):
    note(PAD, p, HIT, 2.2, 46)

x = HIT + 2.0
for name, root, voic in [CH[1], CH[2], CH[3], CH[0], CH[0]]:
    for j, p in enumerate(voic):
        note(PIANO, p, x + j * 0.02, 1.3, 40)
    note(BASS, root, x, 1.0, 46)
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
out = os.path.join(HERE, "r04-lightning.mid")
mid.save(out)
print("wrote", out)
