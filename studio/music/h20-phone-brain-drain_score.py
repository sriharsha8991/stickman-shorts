#!/usr/bin/env python3
"""Score for H20 "Is your phone making you less smart right now?" (h20-phone-brain-drain).

100 BPM, 4/4 -> 1 bar = 2.4 s = 72 video frames. 18 bars = 43.2 s (voice 43.2 s). Calm, curious, a little playful:
  bars 0-3   the study, hook      soft marimba chords (A, F#m, D, Esus), pizzicato-bass roots, light shaker
  bar  3     into the test room   rising marimba run on the slice
  bars 4-8   the memory test      curious pizzicato arpeggios (Bm, E, A, F#m, D)
  bars 9-14  the twist + review   long soft bassoon notes + quiet marimba off-beats (sparse under the voice)
  bars 15-16 back at your desk    warm glockenspiel answer (A, D)
  bar  17    loop                 bar 0 again so the end flows into frame 0
Different from V028 (C minor piano/EP 92 BPM) and V105 (G major harp/flute 100 BPM).
"""
import os

import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, EP, VIB, PAD, BASS, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {PIANO: 12, EP: 45, VIB: 9, PAD: 70, BASS: 32}
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



# --- H20 arrangement (100 BPM A major; marimba + pizzicato + bassoon + glock) ---
CH.update({
    "A": (45, [57, 61, 64, 69]),
    "F#m": (42, [57, 61, 66, 69]),
    "D": (38, [57, 62, 66, 69]),
    "E": (40, [56, 59, 64, 68]),
    "Bm": (47, [59, 62, 66, 71]),
    "Esus": (40, [57, 59, 64, 69]),
})


def marimba(b, name, v=40):
    root, ps = CH[name]
    for k, off in enumerate([0, int(1.5 * Q), 3 * Q]):
        for p in ps[:3]:
            note(PIANO, p + 12, bar(b) + off, Q, v - k * 5)
    note(BASS, root, bar(b), Q, 46)
    note(BASS, root + 7, bar(b) + 2 * Q, Q, 40)


def shaker(b, v=12):
    for k in range(8):
        note(DRUMS, 70, bar(b) + k * E8, S16, v + (5 if k % 2 else 0))


def pizz(b, name, v=40):
    root, ps = CH[name]
    seq = [ps[0], ps[1], ps[2], ps[1], ps[3], ps[2], ps[1], ps[2]]
    for k in range(8):
        note(EP, seq[k], bar(b) + k * E8, E8, v - (k % 2) * 8)
    note(BASS, root, bar(b), Q, 44)


def bassoon(b, name, v=34):
    root, ps = CH[name]
    note(PAD, ps[0] - 12, bar(b), 2 * Q, v)
    note(PAD, ps[1] - 12, bar(b) + 2 * Q, 2 * Q, v - 4)


def glock(b, name, v=34):
    root, ps = CH[name]
    for k, off in enumerate([0, Q, 2 * Q]):
        note(VIB, ps[(k + 1) % 4] + 12, bar(b) + off, Q * 2, v - k * 4)
    note(BASS, root, bar(b), 2 * Q, 42)


# study: hook + stakes (bars 0-3)
for b, n in [(0, "A"), (1, "F#m"), (2, "D"), (3, "Esus")]:
    marimba(b, n)
    shaker(b)
# into the test room: rising marimba run
for k, p in enumerate([69, 71, 73, 76, 78, 81]):
    note(PIANO, p, bar(3) + 2 * Q + k * (Q // 3), Q, 34)
# the test (bars 4-8): curious pizzicato
for b, n in [(4, "Bm"), (5, "E"), (6, "A"), (7, "F#m"), (8, "D")]:
    pizz(b, n)
# twist: bar 8 second half drops (pizz already ends), bars 9-14: bassoon + soft marimba
for b, n in [(9, "D"), (10, "A"), (11, "E"), (12, "F#m"), (13, "D"), (14, "E")]:
    bassoon(b, n)
    root, ps = CH[n]
    for p in ps[:3]:
        note(PIANO, p + 12, bar(b) + 2 * Q, Q, 28)
# back at the desk (bars 15-16): warm glockenspiel answer
for b, n in [(15, "A"), (16, "D")]:
    glock(b, n)
    shaker(b, 10)
# loop (bar 17): bar 0 again
marimba(17, "A")
shaker(17)
mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(100), time=0))
for ch, prog in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
    tr.append(mido.Message("control_change", channel=ch, control=91, value=60, time=0))
last = 0
for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
    tr.append(m.copy(time=t - last))
    last = t
mid.save(os.path.join(HERE, "h20-phone-brain-drain.mid"))
print("wrote h20-phone-brain-drain.mid", len(events) // 2, "notes")
