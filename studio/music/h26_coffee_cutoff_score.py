#!/usr/bin/env python3
"""Score for H26 "Your 3 PM coffee is stealing an hour of sleep" (h26-coffee-cutoff).

Lullaby waltz, 84 BPM, 3/4 (1 bar = 2.14 s). Celesta + music box + warm pad + upright bass, no drums.
Sections (seconds, anchored to the voiceover):
  0.0-17.8   3 PM afternoon        F major (F Dm Bb C), celesta on beat 1 only, music-box answer in gaps
  17.8-29.8  night (wow ~19.8 s)   Dm Bb Gm A: pad swells, low bass hit + chime cluster on "bedtime"
  29.8-36.2  caveat + cut-off      Bb C Dm C, gentle lift
  36.2-39.1  loop                  back to F, ends open on F for the loop to 3 PM
Writes h26-coffee-cutoff.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

BPM = 84
TPB = 480
BAR = TPB * 3
HERE = os.path.dirname(os.path.abspath(__file__))
LENGTH = 39.1

CEL, BOX, PAD, BASS, STR = 0, 1, 2, 3, 4
PROGRAMS = {CEL: 8, BOX: 10, PAD: 89, BASS: 32, STR: 49}
events = []


def t(sec):
    return int(sec * BPM / 60 * TPB)


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, v)))))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


CH = {
    "F": (41, [65, 69, 72]), "Dm": (38, [62, 65, 69]), "Bb": (46, [62, 65, 70]), "C": (48, [64, 67, 72]),
    "Gm": (43, [62, 67, 70]), "A": (45, [61, 64, 69]),
}
DAY = ["F", "Dm", "Bb", "C"]
NIGHT = ["Dm", "Bb", "Gm", "A"]
LIFT = ["Bb", "C", "Dm", "C"]


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {CEL: 96, BOX: 70, PAD: 70, BASS: 88, STR: 64}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (CEL, BOX, PAD, STR):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=80)))

    nbars = int(t(LENGTH) // BAR) + 1
    for b in range(nbars):
        s = b * BAR
        sec = s / TPB * 60 / BPM
        if sec < 17.8:
            seq, sect = DAY, "day"
        elif sec < 29.8:
            seq, sect = NIGHT, "night"
        elif sec < 36.2:
            seq, sect = LIFT, "lift"
        else:
            seq, sect = ["F"], "loop"
        name = seq[b % len(seq)]
        root, v = CH[name]
        pv = 44 if sect == "day" else 54 if sect == "night" else 48
        for p in v:
            note(PAD, p - 12, s, BAR, pv)
        if sect == "night":
            note(STR, v[0] - 12, s, BAR, 46)
        # waltz bass: 1 (root), 2-3 soft fifth
        note(BASS, root, s, TPB - 30, 66)
        note(BASS, root + 7, s + TPB * 2, TPB - 30, 44)
        # celesta: one broken chord per bar, light (bed under the voice)
        note(CEL, v[0] + 12, s, TPB, 58)
        note(CEL, v[2] + 12, s + TPB + TPB // 2, TPB // 2, 40)
        # music-box answer every other bar
        if b % 2 == 1:
            note(BOX, v[1] + 24, s + TPB * 2, TPB, 46)
            note(BOX, v[0] + 24, s + TPB * 2 + TPB // 2, TPB, 40)
    # wow on "bedtime" (~19.8 s): low hit + descending chime cluster
    w = t(19.8)
    note(BASS, 26, w, TPB * 3, 100)
    for k, p in enumerate([86, 81, 77, 74, 69]):
        note(BOX, p, w + k * (TPB // 4), TPB, 72 - k * 4)
    # small sting on "lost over an hour" (~26.3 s)
    note(STR, 50, t(26.3), TPB * 2, 70)
    note(STR, 53, t(26.3), TPB * 2, 66)
    # last bar: open F chord for the loop
    end = t(LENGTH - 2.2)
    for p in [65, 69, 72, 77]:
        note(CEL, p, end, TPB * 2, 54)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    tr.append(mido.MetaMessage("time_signature", numerator=3, denominator=4, time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "h26-coffee-cutoff.mid")
    mid.save(out)
    print("wrote", out)


if __name__ == "__main__":
    main()
