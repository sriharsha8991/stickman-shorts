#!/usr/bin/env python3
"""Score for T34 "Can you stop a song stuck in your head?" (Spark Got Tricked #11).

A major, 112 BPM, a bright morning commute: an invented four-bar earworm motif on steel drums (the "stuck song", original,
no real tune), plucked electric bass, a soft shaker, Rhodes chords. The motif sits in the gaps; under the voice only chords.
Timed in seconds against the voice (voice.ts): motif after the hook (3.3 s) and the promise (6.5 s), the bus song (8.3 s),
a nagging repeat at the office, drop 16.9-18.0 s (silence), the gum toss (18.7 s, slide up), the motif winds down like a
music box running out (19.4-21.1 s: slower, lower), the hit on "less!" 21.2 s (timpani + brass + glockenspiel), a calm bed with
ONE slow motif note (less, not gone), the motif returns for the loop. Writes t34-stuck-song.mid. Render with tools/render_midi.py.
"""
import os
import mido

TPB = 480
BPM = 112
TPS = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
RHODES, BASS, DRUMS_S, STEEL, BRASS, TIMP, GLOCK, PAD, MARIMBA, DR = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
PROGRAMS = {RHODES: 4, BASS: 33, STEEL: 114, BRASS: 61, TIMP: 47, GLOCK: 9, PAD: 89, MARIMBA: 12}
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
PROG = [(45, [57, 61, 64, 69]), (42, [57, 61, 66, 69]), (50, [57, 62, 66, 69]), (52, [56, 59, 64, 68])]  # A F#m D E
# the earworm: short, bouncy, repeats (original)
MOTIF = [(76, 0.5), (78, 0.5), (76, 0.5), (73, 0.5), (71, 1.0), (73, 0.5), (76, 0.5)]


def motif(s, v=70, ch=STEEL, stretch=1.0, drop=0):
    x = s
    for p, b in MOTIF:
        note(ch, p - drop, x, b * BEAT * stretch * 0.9, v)
        x += b * BEAT * stretch
    return x


def bed(s0, s1, rv=30, bv=50, sh=16, start_bar=0):
    b = start_bar
    s = s0
    while s < s1 - 0.05:
        root, voic = PROG[b % 4]
        chord(RHODES, voic, s, min(BAR * 0.9, s1 - s), rv)
        for i in range(4):
            bs = s + i * BEAT
            if bs >= s1:
                break
            if i in (0, 2):
                note(BASS, root - 12 + (7 if i == 2 else 0), bs, BEAT * 0.5, bv)
            note(DR, 70, bs, 0.08, sh)  # maracas
            note(DR, 70, bs + BEAT / 2, 0.06, sh - 4)
        s += BAR
        b += 1


# 0-16.9 s: the morning commute bed, motif in the gaps
bed(0.0, 16.85)
motif(3.30, 64)
motif(6.50, 58)
for i, p in enumerate([81, 83, 85]):
    note(GLOCK, p, 8.05 + i * 0.12, 0.3, 48)  # the bus speaker plays
motif(9.85, 54)  # a nagging repeat as he walks to the office
motif(12.85, 44)
# 16.85-18.05 s: the drop (silence)
# the gum toss: a marimba slide up
for i, p in enumerate(range(69, 82, 2)):
    note(MARIMBA, p, 18.55 + i * 0.04, 0.2, 60)
note(PAD, 57, 18.1, 3.0, 38)
# the motif winds down: slower and lower, like a music box running out
x = 19.4
for i, (p, b) in enumerate(MOTIF):
    st = 1.0 + i * 0.25
    note(STEEL, p - i, x, b * BEAT * st * 0.9, 60 - i * 5)
    x += b * BEAT * st * 0.8
# 21.2 s: the hit on "less!"
H = 21.2
note(TIMP, 33, H - 0.15, 0.2, 70)
note(TIMP, 33, H, 1.6, 120)
note(DR, 49, H, 1.6, 100)
chord(BRASS, [57, 64, 69, 73, 76], H, 1.9, 108)
chord(PAD, [57, 64, 69, 73], H, 3.0, 78)
for i, p in enumerate([81, 85, 88, 93, 97]):
    note(GLOCK, p, H + 0.05 + i * 0.08, 0.6, 86)
chord(BRASS, [57, 62, 66, 69], H + 2.0, 0.5, 60)
# 23.1-28.6 s: a calm bed; one slow motif note now and then (less, not gone)
bed(23.0, 28.55, rv=26, bv=40, sh=10, start_bar=0)
for s in (24.0, 25.9, 27.6):
    note(STEEL, 76, s, 0.5, 40)
# the loop: the motif returns at full speed into frame 0
motif(28.55, 66)

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
out = os.path.join(HERE, "t34-stuck-song.mid")
mid.save(out)
print("wrote", out)
