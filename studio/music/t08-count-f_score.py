#!/usr/bin/env python3
"""Score for T08 "How many Fs can you count?" (Spark Got Tricked #12).

E major, 104 BPM, a busy office morning: staccato piano chords, pizzicato strings for the bass line, a comic bassoon
answering in the gaps, a soft woodblock tick like a typewriter. Timed in seconds against the voice (voice.ts):
hook 0.2-3.2 s, promise 3.8 s, the count test 8.1-14.6 s (almost silent: one held pad note, nothing rhythmic, so it
never helps or hinders counting), Spark's three ticks (14.9-15.3 s, celesta), his smug "sure" (bassoon), the boss's steps,
the "six!" hit 18.7 s (pizz + low brass stab), the drop 19.3-20.1 s (silence), three rising celesta + brass notes on each
OF ring (20.9, 21.4, 21.9 s) and the big chord on "times." 22.0 s (timpani + brass + glockenspiel), a calm bed under the
takeaway, the office groove back into frame 0 for the loop. Writes t08-count-f.mid. Render with tools/render_midi.py.
"""
import os
import mido

TPB = 480
BPM = 104
TPS = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, PIZZ, BSN, CEL, BRASS, TIMP, GLOCK, PAD, DR = 0, 1, 2, 3, 4, 5, 6, 7, 9
PROGRAMS = {PIANO: 0, PIZZ: 45, BSN: 70, CEL: 8, BRASS: 61, TIMP: 47, GLOCK: 9, PAD: 89}
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
# E  C#m  A  B
PROG = [(40, [56, 59, 64]), (37, [56, 61, 64]), (45, [57, 61, 64]), (47, [54, 59, 63])]


def bed(s0, s1, pv=34, bv=52, wb=14, start_bar=0):
    b = start_bar
    s = s0
    while s < s1 - 0.05:
        root, voic = PROG[b % 4]
        for i in range(4):
            bs = s + i * BEAT
            if bs >= s1:
                break
            note(PIZZ, root + (0 if i % 2 == 0 else 7), bs, BEAT * 0.35, bv)
            if i in (1, 3):
                chord(PIANO, voic, bs, BEAT * 0.25, pv)  # off-beat staccato chords
            note(DR, 76 if i % 2 == 0 else 77, bs + BEAT / 2, 0.05, wb)  # woodblock "typewriter"
        s += BAR
        b += 1


def bassoon(s, notes, v=58):
    x = s
    for p, b in notes:
        note(BSN, p, x, b * BEAT * 0.85, v)
        x += b * BEAT


# 0-8.1 s: the office groove; bassoon answers in the gaps after the hook and the promise
bed(0.0, 8.05)
bassoon(3.30, [(52, 0.5), (56, 0.5), (59, 1.0)], 56)
bassoon(5.40, [(59, 0.5), (56, 0.5), (52, 1.0)], 50)
# 8.1-14.6 s: the count test. One soft held pad note, nothing rhythmic.
note(PAD, 52, 8.2, 6.2, 22)
note(PAD, 59, 8.2, 6.2, 16)
# 14.6 s: Spark counts three (celesta ticks), smug bassoon on "sure"
for i, s in enumerate([14.9, 15.1, 15.3]):
    note(CEL, 76 + i * 4, s, 0.25, 62)
bed(14.6, 18.6, pv=28, bv=44, wb=10, start_bar=0)
bassoon(16.7, [(47, 0.5), (52, 0.5), (56, 1.0)], 54)
# 18.7 s: "six!" a stab
H1 = 18.67
chord(BRASS, [40, 47, 52, 55], H1, 0.5, 92)  # E minor colour: he was wrong
note(PIZZ, 28, H1, 0.4, 100)
note(TIMP, 28, H1, 0.6, 90)
# 19.3-20.1 s: the drop (silence)
# 20.9 / 21.4 / 21.9 s: each OF ring, rising
for s, p in [(20.90, 76), (21.37, 80), (21.87, 83)]:
    note(CEL, p, s, 0.5, 80)
    note(BRASS, p - 24, s, 0.35, 70)
# 22.0 s: the big chord on "times."
H = 21.97
note(TIMP, 28, H - 0.15, 0.2, 70)
note(TIMP, 28, H, 1.6, 120)
note(DR, 49, H, 1.6, 100)
chord(BRASS, [52, 56, 59, 64, 68], H, 2.0, 108)
chord(PAD, [52, 59, 64, 68], H, 3.0, 76)
for i, p in enumerate([83, 88, 92, 95, 100]):
    note(GLOCK, p, H + 0.05 + i * 0.08, 0.6, 86)
# 23.4-27.0 s: a calm bed under the takeaway
bed(23.6, 27.0, pv=24, bv=38, wb=8, start_bar=2)
bassoon(26.75, [(56, 0.5), (59, 0.5)], 46)
# 27.2-30.1 s: the question, the groove back into frame 0
bed(27.2, 30.13, pv=32, bv=50, wb=14, start_bar=0)

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
out = os.path.join(HERE, "t08-count-f.mid")
mid.save(out)
print("wrote", out)
