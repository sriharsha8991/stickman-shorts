#!/usr/bin/env python3
"""Score for V028 "Does your cab cost more when your battery is low?" (v028-low-battery-fare).

92 BPM, 4/4 -> 1 bar = 2.61 s = 78.3 video frames. 16 bars = 41.7 s (voice is 39.6 s). Calm rainy-night mood:
  bars 0-2   rainy street, hook   soft piano chords (Cm, Ab, Fm) + warm pad + quiet hi-hat "rain" eighths
  bar  3     into the data room   rising piano run on the iris, held Bb sus
  bars 4-8   the data room        brighter electric-piano arpeggios (Eb, Bb, Cm, Ab, Bb), bass roots, no drums
  bar  9     back to the street   half-bar drop, then Cm returns
  bar  10-11 rush and say yes     woodblock ticks like a clock under Ab, G
  bars 12-14 charge early         warm vibraphone in Eb major (Eb, Ab, Bb): the calm answer
  bar  15    loop                 bar 0 again so the end flows into frame 0
Different from V105 (G major harp/flute 100 BPM) and V018 (D minor vibraphone/pizzicato 80 BPM).
"""
import os

import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, EP, VIB, PAD, BASS, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {PIANO: 0, EP: 4, VIB: 11, PAD: 89, BASS: 32}
events = []
Q, E8, S16 = TPB, TPB // 2, TPB // 4


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def bar(b):
    return b * BAR


CH = {
    "Cm": (36, [55, 60, 63, 67]),
    "Ab": (44, [56, 60, 63, 68]),
    "Fm": (41, [56, 60, 65, 68]),
    "G": (43, [55, 59, 62, 67]),
    "Eb": (39, [55, 58, 63, 67]),
    "Bb": (46, [53, 58, 62, 65]),
    "Bbsus": (46, [53, 58, 63, 65]),
}


def pad(b, name, v=24, length=BAR):
    for p in CH[name][1][:3]:
        note(PAD, p, bar(b), length, v)


def piano(b, name, v=38):
    root, ps = CH[name]
    for k, off in enumerate([0, int(1.5 * Q), 3 * Q]):
        for p in ps[:3]:
            note(PIANO, p, bar(b) + off, Q, v - k * 4)
    note(BASS, root, bar(b), 2 * Q, 44)
    pad(b, name)


def rain(b, v=14):
    for k in range(8):
        note(DRUMS, 42, bar(b) + k * E8, S16, v + (6 if k % 2 == 0 else 0))


def ep(b, name, v=36):
    root, ps = CH[name]
    seq = ps + [ps[2] + 12, ps[1] + 12]
    for k in range(8):
        note(EP, seq[k % len(seq)] + 12, bar(b) + k * E8, E8 * 2, v - (k % 2) * 6)
    note(BASS, root, bar(b), Q, 46)
    note(BASS, root + 7, bar(b) + 2 * Q, Q, 40)
    pad(b, name, 20)


def vib(b, name, v=40):
    root, ps = CH[name]
    for k, off in enumerate([0, Q, 2 * Q, 3 * Q]):
        note(VIB, ps[(k + 1) % 4] + 12, bar(b) + off, Q * 2, v - (k % 2) * 6)
    note(BASS, root, bar(b), 2 * Q, 44)
    pad(b, name, 26)


# rainy street: hook
for b, n in [(0, "Cm"), (1, "Ab"), (2, "Fm")]:
    piano(b, n)
    rain(b)
note(PIANO, 75, bar(1) + 3 * Q, Q, 30)
# into the data room: rising run + held sus
for k, p in enumerate([60, 63, 67, 70, 72, 75, 79, 82]):
    note(PIANO, p, bar(3) + 2 * Q + k * (Q // 4), Q, 34)
pad(3, "Bbsus", 30)
note(BASS, 46, bar(3), 2 * Q, 40)
# the data room: brighter EP arpeggios
for b, n in [(4, "Eb"), (5, "Bb"), (6, "Cm"), (7, "Ab"), (8, "Bb")]:
    ep(b, n)
# back to the street: drop the first half, then Cm
piano_ps = CH["Cm"][1]
for p in piano_ps[:3]:
    note(PIANO, p, bar(9) + 2 * Q, 2 * Q, 36)
note(BASS, 36, bar(9) + 2 * Q, 2 * Q, 42)
rain(9, 12)
# rush: clock ticks
for b, n in [(10, "Ab"), (11, "G")]:
    piano(b, n, v=34)
    for k in range(8):
        note(DRUMS, 76 if k % 2 == 0 else 77, bar(b) + k * E8, S16, 26)
# charge early: warm vibraphone, Eb major
for b, n in [(12, "Eb"), (13, "Ab"), (14, "Bb")]:
    vib(b, n)
# loop
piano(15, "Cm")
rain(15)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(92), time=0))
for ch, prog in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
    tr.append(mido.Message("control_change", channel=ch, control=91, value=60, time=0))
last = 0
for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
    tr.append(m.copy(time=t - last))
    last = t
mid.save(os.path.join(HERE, "v028-low-battery-fare.mid"))
print("wrote v028-low-battery-fare.mid", len(events) // 2, "notes")
