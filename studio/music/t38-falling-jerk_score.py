#!/usr/bin/env python3
"""Score for T38 "Why does your body jump as you fall asleep?" (Spark Got Tricked #10).

E major, 76 BPM, night music box: felt piano chords, pizzicato bass, a soft wood-block clock tick, music-box notes only in
the gaps (a bed under the voice). Different from T01's harp lullaby (Ab, 80 BPM) and T35's office jazz.
Timed in seconds against the voice (voice.ts): landing bump 0.6 s, rug pull 9.0 s (falling notes 9.7 s), the jolt 11.47 s
(timpani + cymbal), a quiet tick under "did not move", drop 16.1-16.95 s (silence), one rising celesta note per window
(16.97-18.67 s), the hit on "normal!" 18.93 s (timpani + crash + warm brass + glockenspiel), a calm flute tune for the tip,
ends on E for the loop. Writes t38-falling-jerk.mid next to this file. Render with tools/render_midi.py.
"""
import os
import mido

TPB = 480
BPM = 76
TPS = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, BASS, BOX, CEL, BRASS, TIMP, GLOCK, FLUTE, PAD, DR = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
PROGRAMS = {PIANO: 0, BASS: 45, BOX: 10, CEL: 8, BRASS: 61, TIMP: 47, GLOCK: 9, FLUTE: 73, PAD: 89}
ev = []


def t(sec):
    return int(round(sec * TPS))


def note(ch, p, s, d, v):
    ev.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    ev.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


BEAT = 60 / BPM
BAR = 4 * BEAT
PROG = [(40, [56, 59, 64, 68]), (37, [56, 61, 64, 68]), (33, [57, 61, 64, 69]), (35, [54, 59, 63, 66])]  # E C#m A B


def bed(s0, s1, pv=30, bv=44, tick=18, start_bar=0):
    b = start_bar
    s = s0
    while s < s1 - 0.05:
        root, voic = PROG[b % 4]
        chord(PIANO, voic, s, min(BAR * 0.95, s1 - s), pv)
        for i in range(4):
            bs = s + i * BEAT
            if bs >= s1:
                break
            if i in (0, 2):
                note(BASS, root + (7 if i == 2 else 0), bs, BEAT * 0.6, bv)
            note(DR, 76 if i % 2 == 0 else 77, bs, 0.08, tick)  # the clock
        s += BAR
        b += 1


# 0-16.1 s: the night bed
bed(0.0, 16.1)
note(TIMP, 40, 0.6, 0.4, 55)  # he lands on the mattress
for i, p in enumerate([76, 80, 83]):
    note(BOX, p, 4.0 + i * 0.25, 0.6, 52)  # gap after the hook
for i, p in enumerate([83, 80, 76, 71]):
    note(BOX, p, 6.2 + i * 0.22, 0.5, 46)  # lies down
for i, p in enumerate([88, 87, 85, 83, 81, 80, 78, 76, 75, 73, 71, 69, 68]):
    note(CEL, p, 9.0 + i * 0.06, 0.3, 58)  # the rug is pulled, little Spark falls
# the jolt
J = 11.47
note(TIMP, 40, J - 0.12, 0.2, 60)
note(TIMP, 33, J, 1.0, 112)
note(DR, 49, J, 1.2, 85)
chord(BRASS, [52, 59, 64], J, 0.5, 80)
# 16.1-16.95 s: drop (nothing)
# windows: one rising celesta note each, a soft pad swells
WIN = [16.97, 17.3, 17.5, 17.77, 18.2, 18.67]
for i, w in enumerate(WIN):
    note(CEL, [68, 71, 73, 76, 78, 80][i], w, 0.9, 60 + i * 5)
note(PAD, 52, 16.97, 1.96, 50)
note(PAD, 59, 16.97, 1.96, 46)
note(TIMP, 40, 18.6, 0.2, 60)
note(TIMP, 40, 18.78, 0.15, 75)
# 18.93 s: the hit on "normal!"
H = 18.93
note(TIMP, 28, H, 1.6, 120)
note(DR, 49, H, 1.6, 100)
chord(BRASS, [52, 59, 64, 68, 71], H, 1.9, 108)
chord(PAD, [52, 59, 64, 68], H, 3.2, 80)
for i, p in enumerate([76, 80, 83, 88, 92, 95]):
    note(GLOCK, p, H + 0.05 + i * 0.08, 0.6, 88)
chord(BRASS, [54, 59, 63, 66], H + 2.1, 0.5, 64)
chord(BRASS, [52, 56, 59, 64], H + 2.5, 0.9, 72)
# 21.0-27.77 s: calmer bed + a small flute tune in the gaps, ends on E for the loop
bed(21.0, 27.0, pv=26, bv=38, tick=14)
for i, (p, d) in enumerate([(76, 0.4), (78, 0.4), (80, 0.8)]):
    note(FLUTE, p, 23.8 + sum(x[1] for x in [(76, 0.4), (78, 0.4), (80, 0.8)][:i]), d, 50)
chord(PIANO, [52, 56, 59, 64], 27.0, 0.77, 34)
note(BASS, 40, 27.0, 0.77, 44)
note(BOX, 88, 27.3, 0.4, 48)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
for ch, prog in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
last = 0
for tick, _, msg in sorted(ev, key=lambda e: (e[0], e[1])):
    tr.append(msg.copy(time=tick - last))
    last = tick
out = os.path.join(HERE, "t38-falling-jerk.mid")
mid.save(out)
print("wrote", out)
