#!/usr/bin/env python3
"""Score for T15 "How many people does it take to share a birthday?" (office party, pencil look).

Eb major, 116 BPM, 4/4: a light office-party bed (nylon guitar, pizzicato bass, soft pad) that stays sparse under the voice.
Small original celesta figures sit in the gaps between lines; a glockenspiel blip on the coin flip (10.9 s); a brass stab on
"twenty-three" (17.1 s); full silence for the pause before the reveal (21.4-22.2 s); a tremolo-strings riser while the web
draws (22.2-24.9 s); timpani + brass + glockenspiel hit on "pairs!" (24.9 s); a soft guitar tag that loops back to frame 0.
Times are in seconds (from the voice timeline) and converted to ticks. Writes t15-birthday.mid next to this file.
"""
import os

import mido

TPB = 480
BPM = 116
HERE = os.path.dirname(os.path.abspath(__file__))
GUIT, PAD, BASS, CELESTA, GLOCK, STR, BRASS, TIMP, DRUMS = 0, 1, 2, 3, 4, 5, 6, 7, 9
PROGRAMS = {GUIT: 24, PAD: 89, BASS: 45, CELESTA: 8, GLOCK: 9, STR: 44, BRASS: 61, TIMP: 47}
events = []


def t(sec):
    return int(round(sec * BPM / 60 * TPB))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


BEAT = 60 / BPM
BARS = [("Eb", 39, [55, 58, 63]), ("Cm", 36, [55, 60, 63]), ("Ab", 44, [56, 60, 63]), ("Bb", 46, [53, 58, 62])]
DROP0, DROP1, HIT, END = 21.35, 22.2, 24.9, 29.45

# bed: bars of 4 beats until the drop
b = 0
s = 0.0
while s < DROP0 - 0.05:
    name, root, voic = BARS[b % 4]
    for beat in range(4):
        x = s + beat * BEAT
        if x >= DROP0 - 0.05:
            break
        if beat in (0, 2):
            note(BASS, root, x, BEAT * 0.6, 62)
        # soft guitar: a light strum on 1, off-beat chops on 2 and 4
        if beat == 0:
            for i, p in enumerate(voic):
                note(GUIT, p, x + i * 0.012, BEAT * 1.5, 40)
        if beat in (1, 3):
            for p in voic:
                note(GUIT, p, x + BEAT / 2, BEAT * 0.35, 30)
    for p in voic:
        note(PAD, p, s, min(4 * BEAT, DROP0 - s), 30)
    b += 1
    s += 4 * BEAT

# shaker on the off-beats, very light, from the promise to the drop
x = 3.6
while x < DROP0 - 0.1:
    note(DRUMS, 70, x + BEAT / 2, 0.1, 26)
    x += BEAT

# celesta figures in the gaps (original)
GAPS = [(3.1, [75, 79, 82]), (5.15, [77, 79, 75]), (8.55, [70, 75, 79, 82]), (12.0, [82, 79, 77]), (14.85, [75, 74, 72, 70])]
for g, notes in GAPS:
    for i, p in enumerate(notes):
        note(CELESTA, p, g + i * 0.13, 0.3, 58)
# coin flip blip
note(GLOCK, 87, 10.9, 0.2, 70)
note(GLOCK, 91, 11.05, 0.25, 64)
note(GLOCK, 94, 11.75, 0.4, 70)
# "twenty-three": brass stab + soft timpani
for p in (63, 67, 70):
    note(BRASS, p, 17.1, 0.35, 78)
note(TIMP, 39, 17.1, 0.6, 70)
note(CELESTA, 87, 18.2, 0.4, 55)
note(CELESTA, 82, 18.4, 0.5, 50)

# riser while the web draws: tremolo strings climb, pizzicato arpeggio climbs
r0 = DROP1
steps = [58, 60, 62, 63, 65, 67, 68, 70]
for i, p in enumerate(steps):
    x = r0 + i * (HIT - r0 - 0.15) / len(steps)
    note(STR, p, x, (HIT - r0) / len(steps) + 0.05, 40 + i * 9)
    note(STR, p - 12, x, (HIT - r0) / len(steps) + 0.05, 36 + i * 8)
for i in range(16):
    x = r0 + i * (HIT - r0 - 0.1) / 16
    note(BASS, [51, 55, 58, 63][i % 4] + 12 * (i // 8), x, 0.12, 50 + i * 3)

# the hit on "pairs!"
note(TIMP, 39, HIT, 1.2, 118)
note(TIMP, 46, HIT + 0.02, 1.0, 100)
for p in (51, 58, 63, 67, 70, 75):
    note(BRASS, p, HIT, 1.4, 100)
for i, p in enumerate((87, 91, 94, 99)):
    note(GLOCK, p, HIT + i * 0.09, 0.8, 92)
for p in (55, 58, 63):
    note(PAD, p, HIT, 2.0, 50)

# tag: soft guitar + celesta, back to the opening chord so the loop is seamless
x = HIT + 1.7
for i, (name, root, voic) in enumerate([BARS[2], BARS[3], BARS[0]]):
    for j, p in enumerate(voic):
        note(GUIT, p, x + j * 0.015, 1.4, 42)
    note(BASS, root, x, 0.8, 58)
    x += 1.4
for i, p in enumerate([82, 79, 77, 75]):
    note(CELESTA, p, 26.9 + i * 0.5 if i < 2 else 28.5 + (i - 2) * 0.25, 0.45, 48)

# assemble
mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
for ch, prog in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
tr.append(mido.Message("control_change", channel=STR, control=7, value=90, time=0))
events.sort(key=lambda e: (e[0], e[1]))
last = 0
for tick, _, msg in events:
    tr.append(msg.copy(time=tick - last))
    last = tick
out = os.path.join(HERE, "t15-birthday.mid")
mid.save(out)
print("wrote", out, f"{t(END)} ticks")
