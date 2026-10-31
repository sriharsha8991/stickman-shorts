#!/usr/bin/env python3
"""Score for V024 "You stopped scrolling for two seconds, and your app noticed." (v024-pause-noticed).

96 BPM, 4/4 -> 1 bar = 2.5 s = 75 video frames. 17 bars = 42.5 s (voice 40.5 s; rendered with --length 40.6).
Calm evening, curious, sparse under the voice:
  bars 0-4   coral balcony, hook    soft celesta chords (F, Dm, Bb, C), upright-bass roots, brushed hat
  bar  4     into the app (iris)    rising kalimba run
  bars 5-12  inside the app         ticking kalimba off-beat arpeggios (Gm, C, F, Dm, Bb, C, Am, Dm) + woodblock "clock" ticks
  bar  12    the twist              half-bar drop, then a soft string swell on "pauses"
  bars 13-15 back on the balcony    warm strings pad + celesta answer (Bb, C, F)
  bar  16    loop                   bar 0 again so the end flows into frame 0
Different from H20 (A major marimba/pizzicato 100 BPM) and V028 (C minor piano 92 BPM).
"""
import os

import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))
CEL, KAL, STR, BASS, DRUMS = 0, 1, 2, 3, 9
PROGRAMS = {CEL: 8, KAL: 108, STR: 49, BASS: 32}
events = []
Q, E8, S16 = TPB, TPB // 2, TPB // 4


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def bar(b):
    return int(b * BAR)


CH = {
    "F": (41, [60, 65, 69, 72]),
    "Dm": (38, [62, 65, 69, 74]),
    "Bb": (46, [62, 65, 70, 74]),
    "C": (36, [60, 64, 67, 72]),
    "Gm": (43, [62, 67, 70, 74]),
    "Am": (45, [60, 64, 69, 72]),
}


def celesta(b, name, v=36):
    root, ps = CH[name]
    for k, off in enumerate([0, int(1.5 * Q), 3 * Q]):
        for p in ps[:3]:
            note(CEL, p + 12, bar(b) + off, Q, v - k * 5)
    note(BASS, root, bar(b), 2 * Q, 46)
    note(BASS, root + 7, bar(b) + 2 * Q, Q, 38)


def hat(b, v=11):
    for k in range(4):
        note(DRUMS, 42, bar(b) + k * Q + E8, S16, v)


def kalimba(b, name, v=38):
    root, ps = CH[name]
    seq = [ps[0], ps[2], ps[1], ps[3]]
    for k in range(4):
        note(KAL, seq[k] + 12, bar(b) + k * Q + E8, Q, v - (k % 2) * 6)
    note(BASS, root, bar(b), Q, 42)
    note(DRUMS, 76, bar(b), S16, 22)  # woodblock tick (the stopwatch)
    note(DRUMS, 77, bar(b) + 2 * Q, S16, 18)


def strings(b, name, v=30, length=BAR):
    root, ps = CH[name]
    for p in ps[:3]:
        note(STR, p, bar(b), length, v)
    note(BASS, root, bar(b), 2 * Q, 40)


# balcony (bars 0-4)
for b, n in [(0, "F"), (1, "Dm"), (2, "Bb"), (3, "C"), (4, "F")]:
    celesta(b, n)
    hat(b)
# into the app: rising kalimba run (iris at ~bar 4.8)
for k, p in enumerate([65, 67, 69, 72, 74, 77]):
    note(KAL, p + 12, bar(4) + 2 * Q + k * (Q // 3), Q, 34)
# inside the app (bars 5-11)
for b, n in [(5, "Gm"), (6, "C"), (7, "F"), (8, "Dm"), (9, "Bb"), (10, "C"), (11, "Am")]:
    kalimba(b, n)
# the twist: bar 12 first half drops, then a soft swell
strings(12.5, "Dm", 26, 2 * Q)
note(KAL, 86, bar(12.5), Q * 2, 30)
# back on the balcony (bars 13-15)
for b, n in [(13, "Bb"), (14, "C"), (15, "F")]:
    strings(b, n, 28)
    root, ps = CH[n]
    for k, off in enumerate([0, Q, 2 * Q]):
        note(CEL, ps[(k + 1) % 4] + 12, bar(b) + off, Q * 2, 32 - k * 4)
    hat(b, 9)
# loop (bar 16): bar 0 again
celesta(16, "F")
hat(16)
mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(96), time=0))
for ch, prog in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
    tr.append(mido.Message("control_change", channel=ch, control=91, value=60, time=0))
last = 0
for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
    tr.append(m.copy(time=t - last))
    last = t
mid.save(os.path.join(HERE, "v024-pause-noticed.mid"))
print("wrote v024-pause-noticed.mid", len(events) // 2, "notes")
