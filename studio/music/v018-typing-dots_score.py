#!/usr/bin/env python3
"""Score for V018 "Why do you feel nervous when the typing dots stop?" (v018-typing-dots).

80 BPM, 4/4 -> 1 bar = 3 s = 90 video frames. 14 bars = 42 s (voice is 40.7 s). Calm dusk mood, sparse under the voice:
  bars 0-2   dusk room     warm pad + vibraphone "three dots" motif (three soft repeated notes), Dm9 / Bbmaj7
  bars 3-6   the game      pizzicato strings + soft marimba plucks, Gm7 C F Dm, light brush ticks
  bar  7     the reveal    half-bar drop to silence, then a low pad swell (A7sus -> A7) on "stress"
  bar  8     for sure      settles on Dm, celesta answer
  bars 9-11  back home     gentle F major turn: F Bbmaj7 C F, celesta melody in the gaps
  bars 12-13 loop          same as bars 0-1 so the end flows into frame 0
Different from V104 (E major nylon guitar 92 BPM) and V021 (Bb tuba 112 BPM).
"""
import os

import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))
PAD, VIBES, PIZZ, MARIMBA, BASS, CELESTA, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {PAD: 89, VIBES: 11, PIZZ: 45, MARIMBA: 12, BASS: 32, CELESTA: 8}
events = []


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


def bar(b):
    return b * BAR


Q, E8 = TPB, TPB // 2
CH = {
    "Dm9": (38, [53, 57, 60, 64]),
    "Bbmaj7": (34, [50, 53, 57, 62]),
    "Gm7": (43, [53, 58, 62, 65]),
    "C": (36, [52, 55, 60]),
    "F": (41, [53, 57, 60]),
    "Dm": (38, [50, 53, 57]),
    "A7sus": (45, [52, 57, 62, 67]),
    "A7": (45, [52, 55, 61, 64]),
    "Fmaj7": (41, [52, 57, 60, 64]),
    "C6": (36, [52, 57, 60, 64]),
}


def room(b, name, dots=True):
    root, v = CH[name]
    s = bar(b)
    chord(PAD, v, s, BAR, 40)
    note(BASS, root, s, BAR - E8, 48)
    if dots:  # three soft "typing dots" on beats 1, 1&, 2 then silence
        top = v[-1] + 12
        for k in range(3):
            note(VIBES, top, s + k * E8, E8, 44 - k * 4)
        note(VIBES, v[1] + 12, s + 3 * Q, Q, 34)


def game(b, name):
    root, v = CH[name]
    s = bar(b)
    chord(PAD, v[:3], s, BAR, 30)
    note(BASS, root, s, Q, 52)
    note(BASS, root + 7, s + 2 * Q, Q, 44)
    for k, off in enumerate([0, Q + E8, 2 * Q + E8]):
        note(PIZZ, v[k % len(v)] + 12, s + off, E8, 50)
    note(MARIMBA, v[-1] + 12, s + 3 * Q, E8, 40)
    for beat in range(4):
        note(DRUMS, 42, s + beat * Q + E8, E8 // 2, 22)


def home(b, name, mel):
    root, v = CH[name]
    s = bar(b)
    chord(PAD, v, s, BAR, 38)
    note(BASS, root, s, 2 * Q, 48)
    note(BASS, root + 7, s + 2 * Q, 2 * Q, 40)
    for p, off, d in mel:
        note(CELESTA, p, s + off, d, 46)


for b, n in [(0, "Dm9"), (1, "Bbmaj7"), (2, "Dm9")]:
    room(b, n, dots=(b != 1))
for b, n in [(3, "Gm7"), (4, "C"), (5, "F"), (6, "Dm")]:
    game(b, n)
# bar 7: the reveal. first half-bar silent (drop), then a swell
s7 = bar(7)
chord(PAD, CH["A7sus"][1], s7 + 2 * Q, Q, 46)
chord(PAD, CH["A7"][1], s7 + 3 * Q, Q, 52)
note(BASS, 45, s7 + 2 * Q, 2 * Q, 56)
# bar 8: for sure -> settle
root, v = CH["Dm"]
chord(PAD, v, bar(8), BAR, 38)
note(BASS, root, bar(8), BAR - E8, 46)
note(CELESTA, 74, bar(8) + Q, Q, 40)
note(CELESTA, 69, bar(8) + 2 * Q, 2 * Q, 36)
home(9, "Fmaj7", [(72, 0, Q), (76, Q, Q), (79, 2 * Q, 2 * Q)])
home(10, "Bbmaj7", [(77, Q, Q), (74, 2 * Q, 2 * Q)])
home(11, "C6", [(76, 0, 2 * Q), (72, 2 * Q, 2 * Q)])
room(12, "Dm9")
room(13, "Bbmaj7", dots=False)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(80), time=0))
for ch, prog in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
    tr.append(mido.Message("control_change", channel=ch, control=91, value=60, time=0))
last = 0
for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
    tr.append(m.copy(time=t - last))
    last = t
mid.save(os.path.join(HERE, "v018-typing-dots.mid"))
print("wrote v018-typing-dots.mid", len(events) // 2, "notes")
