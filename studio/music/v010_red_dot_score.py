#!/usr/bin/env python3
"""Score for V010 "Why that notification dot is red" (v010-red-dot).

Playful, 116 BPM, 4/4, D major. Sparse marimba + soft keys + shaker under the voice.
Sections (seconds, anchored to the voiceover):
  0.0-8.6   hook + red/number     marimba plucks on the downbeat, pad, light shaker (D Bm G A)
  8.6-16.8  Zeigarnik + twist     kick on 1 & 3 enters, keys comp, ding on the twist (~13.8 s)
  16.8-19.8 the pull (wow 17.9 s) crash + low bell hit + glock run, then a riser into the stats
  19.8-28.6 stats / thumb / ping  groove, marimba up an octave, short gaps get small fills
  28.6-34.5 payoff + loop         drums thin out, ends on D for a clean loop to frame 1
Writes v010-red-dot.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

BPM = 116
TPB = 480
BAR = TPB * 4
E8, E16 = TPB // 2, TPB // 4
HERE = os.path.dirname(os.path.abspath(__file__))
LENGTH = 34.5

MAR, PAD, KEYS, BASS, GLOCK, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {MAR: 12, PAD: 89, KEYS: 4, BASS: 33, GLOCK: 9}
events = []


def t(sec):
    return int(sec * BPM / 60 * TPB)


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, v)))))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


CH = {"D": (38, [62, 66, 69]), "Bm": (47, [59, 62, 66]), "G": (43, [59, 62, 67]), "A": (45, [61, 64, 69])}
PROG = ["D", "Bm", "G", "A"]


def bar_of(sec):
    return int(t(sec) // BAR)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {MAR: 100, PAD: 62, KEYS: 80, BASS: 92, GLOCK: 72, DRUMS: 84}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (MAR, PAD, KEYS, GLOCK):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=60)))

    nbars = bar_of(LENGTH) + 1
    wow = t(17.9)
    for b in range(nbars):
        s = b * BAR
        sec = s / TPB * 60 / BPM
        root, v = CH[PROG[b % 4]]
        last = sec >= 28.6
        chord(PAD, [p - 12 for p in v], s, BAR, 40 if sec < 28.6 else 34)
        # marimba: sparse plucks (1, &2, 4) ; up an octave in the stats section
        up = 12 if 19.8 <= sec < 28.6 else 0
        for off, idx, vel in [(0, 0, 70), (TPB + E8, 2, 54), (3 * TPB, 1, 58)]:
            note(MAR, v[idx] + up, s + off, E8, vel)
        if sec >= 8.6 and not last:
            chord(KEYS, v, s + TPB, E8, 40)
            chord(KEYS, v, s + 3 * TPB, E8, 36)
        note(BASS, root, s, TPB * 2 - 40, 64)
        note(BASS, root + 7, s + 2 * TPB, TPB - 40, 52)
        # drums: shaker 8ths always (soft), kick from 8.6 s, snare rim in the groove
        for k in range(8):
            note(DRUMS, 70, s + k * E8, E16, 34 if k % 2 else 46)
        if 8.6 <= sec < 31.5:
            note(DRUMS, 36, s, E8, 70)
            note(DRUMS, 36, s + 2 * TPB, E8, 62)
        if 19.8 <= sec < 28.6:
            note(DRUMS, 37, s + TPB, E8, 52)
            note(DRUMS, 37, s + 3 * TPB, E8, 52)
    # twist ding (glock) ~13.8 s
    for k, p in enumerate([81, 86]):
        note(GLOCK, p, t(13.8) + k * E16, E8, 76)
    # wow: crash + low hit + glock run
    note(DRUMS, 49, wow, TPB * 2, 100)
    note(DRUMS, 36, wow, E8, 110)
    chord(KEYS, [50, 57, 62], wow, TPB * 3, 80)
    for k, p in enumerate([74, 78, 81, 86, 90, 93]):
        note(GLOCK, p, wow + k * E16, E16, 60 + k * 5)
    # riser of 16ths on shaker/hat into the stats
    for k in range(8):
        note(DRUMS, 42, t(18.9) + k * E16, E16, 30 + k * 8)
    # final D for the loop
    end = t(LENGTH - 1.6)
    chord(MAR, [62, 66, 69, 74], end, TPB * 2, 66)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v010-red-dot.mid")
    mid.save(out)
    print("wrote", out)


if __name__ == "__main__":
    main()
