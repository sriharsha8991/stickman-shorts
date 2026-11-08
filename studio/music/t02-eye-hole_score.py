#!/usr/bin/env python3
"""Score for T02 "Is there a hole in your eye?" (Spark Got Tricked #13).

C minor, 88 BPM, a quiet night on the sofa: kalimba arpeggios, a soft fretless bass, a shaker, an alto flute answering
in the gaps. Timed in seconds against the voice (voice.ts): hook 0.2-2.8 s, promise 3.3-6.5 s, Spark's claim 6.9-9.1 s,
the blind-spot test 9.5-19.9 s (almost silent: one soft held pad chord, nothing rhythmic), "spot!" 21.7 s (a minor brass
stab: he was fooled too), the drop 22.1-23.0 s (silence), the ray lands on the disc 24.4 s (kalimba), the big chord on
"cells." 25.5 s in C major (timpani + brass + glockenspiel), a calm bed under the brain line, the night groove back into
frame 0 for the loop. Writes t02-eye-hole.mid. Render with tools/render_midi.py.
"""
import os
import mido

TPB = 480
BPM = 88
TPS = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
KAL, BASS, FLUTE, CEL, BRASS, TIMP, GLOCK, PAD, DR = 0, 1, 2, 3, 4, 5, 6, 7, 9
PROGRAMS = {KAL: 108, BASS: 35, FLUTE: 73, CEL: 8, BRASS: 61, TIMP: 47, GLOCK: 9, PAD: 89}
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
# Cm  Ab  Eb  Bb
PROG = [(36, [60, 63, 67]), (32, [60, 63, 68]), (39, [58, 63, 67]), (34, [58, 62, 65])]


def bed(s0, s1, kv=40, bv=54, sh=12, start_bar=0):
    b = start_bar
    s = s0
    while s < s1 - 0.05:
        root, voic = PROG[b % 4]
        arp = [voic[0], voic[1], voic[2], voic[1] + 12]
        for i in range(8):
            bs = s + i * BEAT / 2
            if bs >= s1:
                break
            if i % 2 == 0 or i in (3, 7):
                note(KAL, arp[i % 4], bs, BEAT * 0.45, kv - (6 if i % 2 else 0))
            note(DR, 70, bs, 0.05, sh if i % 2 else sh // 2)  # maracas/shaker
        for i, p in [(0, root), (2.5, root + 7), (3, root + 12)]:
            if s + i * BEAT < s1:
                note(BASS, p, s + i * BEAT, BEAT * 0.9, bv)
        s += BAR
        b += 1


def flute(s, notes, v=52):
    x = s
    for p, b in notes:
        note(FLUTE, p, x, b * BEAT * 0.9, v)
        x += b * BEAT


# 0-9.4 s: the night groove; flute answers after the hook and the claim
bed(0.0, 9.4)
flute(2.85, [(75, 0.5), (72, 0.5), (67, 1.0)], 50)
flute(9.1, [(67, 0.5), (70, 0.5)], 40)
# 9.5-19.9 s: the test. One soft held pad chord, nothing rhythmic.
chord(PAD, [48, 55, 63], 9.6, 10.2, 22)
# 19.9 s: the answer line; 21.7 s "spot!" minor brass stab
note(CEL, 79, 20.15, 0.4, 56)
note(CEL, 75, 20.4, 0.4, 50)
H1 = 21.67
chord(BRASS, [36, 43, 48, 51], H1, 0.5, 90)
note(BASS, 24, H1, 0.5, 100)
note(TIMP, 36, H1, 0.6, 88)
# 22.1-23.0 s: the drop (silence)
# 23.0-25.4 s: inside the eye, a rising line as the ray travels
for i, p in enumerate([60, 63, 67, 70, 72]):
    note(KAL, p, 23.1 + i * 0.26, 0.4, 50 + i * 4)
note(CEL, 84, 24.4, 0.6, 76)  # the ray lands on the disc
note(PAD, 48, 23.1, 2.3, 28)
# 25.47 s: the big chord on "cells." (C major: the aha)
H = 25.47
note(TIMP, 36, H - 0.15, 0.2, 70)
note(TIMP, 36, H, 1.6, 120)
note(DR, 49, H, 1.6, 96)
chord(BRASS, [48, 52, 55, 60, 64], H, 2.0, 106)
chord(PAD, [48, 55, 60, 64], H, 3.0, 74)
for i, p in enumerate([84, 88, 91, 96, 100]):
    note(GLOCK, p, H + 0.05 + i * 0.08, 0.6, 84)
# 26.5-29.6 s: calm bed under the brain line
bed(26.9, 29.7, kv=30, bv=40, sh=6, start_bar=2)
flute(29.5, [(72, 0.5), (75, 0.5)], 40)
# 29.9-32.8 s: the question, the groove back into frame 0
bed(29.9, 32.78, kv=38, bv=52, sh=12, start_bar=0)

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
out = os.path.join(HERE, "t02-eye-hole.mid")
mid.save(out)
print("wrote", out)
