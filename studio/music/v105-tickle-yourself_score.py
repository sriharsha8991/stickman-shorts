#!/usr/bin/env python3
"""Score for V105 "Why can't you tickle yourself?" (v105-tickle-yourself).

100 BPM, 4/4 -> 1 bar = 2.4 s = 72 video frames. 12 bars = 28.8 s (voice is 27.9 s). Light, curious, tiptoe mood:
  bars 0-1   bedroom, the hook   harp arpeggios (G, Em7) + a soft flute "feather trill" that goes nowhere
  bars 2-4   the brain knows     sparser: harp + bassoon roots, one flute answer per bar (Cmaj7, D6, G)
  bar  5     into the lab        harp glissando up on the shutter, then a held D sus chord
  bars 6-7   the robot           bassoon staccato tiptoe + woodblock ticks (the robot copying the lever), Am7 D7
  bar  8     it tickled          half-beat drop, then a playful flute giggle run (G major) on "tickled"
  bars 9-10  guess missed        calm: harp on Em7, Cmaj7; one flute note
  bar  11    loop                bar 0 again so the end flows into frame 0
Different from V018 (D minor vibraphone/pizzicato 80 BPM) and V104 (E major nylon guitar 92 BPM).
"""
import os

import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))
HARP, FLUTE, BASSOON, PAD, DRUMS = 0, 1, 2, 3, 9
PROGRAMS = {HARP: 46, FLUTE: 73, BASSOON: 70, PAD: 88}
events = []
Q, E8, S16 = TPB, TPB // 2, TPB // 4


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def bar(b):
    return b * BAR


CH = {
    "G": (43, [55, 59, 62, 67]),
    "Em7": (40, [55, 59, 62, 64]),
    "Cmaj7": (36, [55, 59, 60, 64]),
    "D6": (38, [54, 57, 59, 62]),
    "Dsus": (38, [55, 57, 62, 67]),
    "Am7": (45, [55, 57, 60, 64]),
    "D7": (38, [54, 57, 60, 62]),
}


def harp(b, name, v=40, every=E8):
    root, ps = CH[name]
    s = bar(b)
    seq = ps + ps[::-1][1:3]
    for k in range(BAR // every):
        note(HARP, seq[k % len(seq)] + 12, s + k * every, every * 2, v - (k % 2) * 6)
    note(BASSOON, root, s, 2 * Q, 40)
    chord_pad(b, ps, 22)


def chord_pad(b, ps, v):
    for p in ps[:3]:
        note(PAD, p, bar(b), BAR, v)


def trill(b, p, at=2 * Q, n=6, v=42):
    for k in range(n):
        note(FLUTE, p + (2 if k % 2 else 0), bar(b) + at + k * S16, S16, v)


# bedroom: hook
harp(0, "G")
trill(0, 79)
harp(1, "Em7")
note(FLUTE, 76, bar(1) + 3 * Q, Q, 34)
# the brain knows (sparser: quarter-note harp)
for b, n, mel in [(2, "Cmaj7", 76), (3, "D6", 74), (4, "G", 79)]:
    harp(b, n, v=34, every=Q)
    note(FLUTE, mel, bar(b) + 3 * Q, Q, 32)
# into the lab: glissando + held sus chord
for k, p in enumerate([67, 69, 71, 74, 76, 79, 81, 83, 86]):
    note(HARP, p, bar(5) + 2 * Q + k * (Q // 5), Q, 36)
chord_pad(5, CH["Dsus"][1], 30)
note(BASSOON, 38, bar(5), 2 * Q, 36)
# the robot: staccato bassoon tiptoe + woodblock
for b, n in [(6, "Am7"), (7, "D7")]:
    root, ps = CH[n]
    chord_pad(b, ps, 22)
    for k, off in enumerate([0, E8, Q, Q + E8, 2 * Q, 2 * Q + E8, 3 * Q, 3 * Q + E8]):
        note(BASSOON, (root if k % 2 == 0 else root + 7), bar(b) + off, E8 // 2, 46)
        note(DRUMS, 76 if k % 2 == 0 else 77, bar(b) + off, S16, 30)
# it tickled: drop the first beat, then a giggle run
chord_pad(8, CH["G"][1], 30)
note(BASSOON, 43, bar(8) + Q, Q, 44)
for k, p in enumerate([79, 81, 83, 86, 83, 86, 88, 91]):
    note(FLUTE, p, bar(8) + Q + E8 + k * S16, S16, 50)
note(DRUMS, 70, bar(8) + Q + E8, S16, 30)
note(HARP, 79, bar(8) + 3 * Q, Q, 40)
# guess missed: calm
harp(9, "Em7", v=32, every=Q)
harp(10, "Cmaj7", v=32, every=Q)
note(FLUTE, 74, bar(10) + 2 * Q, 2 * Q, 30)
# loop
harp(11, "G")
trill(11, 79)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(100), time=0))
for ch, prog in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
    tr.append(mido.Message("control_change", channel=ch, control=91, value=55, time=0))
last = 0
for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
    tr.append(m.copy(time=t - last))
    last = t
mid.save(os.path.join(HERE, "v105-tickle-yourself.mid"))
print("wrote v105-tickle-yourself.mid", len(events) // 2, "notes")
