#!/usr/bin/env python3
"""V000 · Meet Spark — light, curious bed under the voice (116 BPM, C major, 10 bars ≈ 20.7 s).
Sparse so the narration stays clear: Rhodes stabs, pizzicato motif, soft kick/hat, warm bass.
Writes v000-meet-spark.mid next to this file."""
import os
import mido

TPB, BPM = 480, 116
BAR = TPB * 4
E8 = TPB // 2
HERE = os.path.dirname(os.path.abspath(__file__))
RHODES, PIZZ, BASS, GLOCK, PAD, DR = 0, 1, 2, 3, 4, 9
ev = []

def n(ch, p, s, d, v):
    ev.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    ev.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))

PROG = [("C", 48, [60, 64, 67, 71]), ("Am", 45, [57, 60, 64, 67]), ("F", 41, [57, 60, 65, 69]), ("G", 43, [55, 59, 62, 65])]
for b in range(10):
    name, root, v = PROG[b % 4]
    s = b * BAR
    last = b == 9
    n(PAD, root + 12, s, BAR, 34)
    for k in (0, 2):  # Rhodes on 1 and 3
        for p in v:
            n(RHODES, p, s + k * TPB, TPB, 46)
    if not last:
        n(BASS, root, s, TPB + E8, 70)
        n(BASS, root + 7, s + 2 * TPB + E8, E8, 58)
        motif = [v[2] + 12, v[1] + 12, v[3] + 12, v[2] + 12]
        for k, p in enumerate(motif):  # pizzicato motif on the off-beats
            n(PIZZ, p, s + k * TPB + E8, E8, 58)
        if b >= 1:
            for k in range(4):
                n(DR, 36 if k in (0, 2) else 42, s + k * TPB, E8, 72 if k in (0, 2) else 40)
                n(DR, 42, s + k * TPB + E8, E8, 30)
        if b in (2, 6):  # sparkle on the "hidden mechanism" region
            for k, p in enumerate([72, 76, 79, 84]):
                n(GLOCK, p, s + 3 * TPB + k * (TPB // 4), TPB // 4, 50)
    else:
        n(GLOCK, 84, s, TPB * 2, 55)
        n(BASS, root, s, BAR, 60)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack(); mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
for ch, prog in {RHODES: 4, PIZZ: 45, BASS: 33, GLOCK: 9, PAD: 89}.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
for ch, vol in {RHODES: 80, PIZZ: 90, BASS: 92, GLOCK: 70, PAD: 60, DR: 70}.items():
    tr.append(mido.Message("control_change", channel=ch, control=7, value=vol, time=0))
last = 0
for t, _, m in sorted(ev, key=lambda e: (e[0], e[1])):
    tr.append(m.copy(time=t - last)); last = t
mid.save(os.path.join(HERE, "v000-meet-spark.mid"))
print("ok", round(mid.length, 1), "s")
