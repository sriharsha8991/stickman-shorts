#!/usr/bin/env python3
"""Score for H17 "Why is your mind still on your last task?" (h17-still-tied).

A small office in G minor, 118 BPM: a dry marimba ostinato + plucked bass (different from V032's A-minor nylon guitar and H06's Eb Rhodes). A low
clarinet note leans on the beat whenever the rope is tight. Scribble section thin. Silence from just after the note is stuck to 'let go'. A harp
runs up on 'let go', then G MAJOR on 'better': timpani + brass + cymbal, glockenspiel + bright marimba through the held picture. Quiet at the end,
back to G minor so it loops into frame 0.
"""
import os

import mido

BPM = 118
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
MA, BS, CL, ST, BR, GL, TI, HP, DRUMS = 0, 1, 2, 3, 4, 5, 6, 7, 9
PROGRAMS = {MA: 12, BS: 32, CL: 71, ST: 48, BR: 61, GL: 9, TI: 47, HP: 46}
BEAT = 60 / BPM
# seconds, from the voice cues (30 fps)
REEL, YOU, LEAVE, STAYS, THEN, WROTE, SLAP, DROP, LETGO, BETTER, WRITE, END = 5.83, 6.87, 10.4, 11.53, 17.07, 20.6, 23.6, 23.95, 25.17, 26.73, 30.37, 36.17
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


MIN = [(43, [62, 67, 70]), (39, [63, 67, 70]), (41, [60, 65, 69]), (43, [62, 67, 70])]
MAJ = [(43, [62, 67, 71]), (48, [64, 67, 72]), (50, [62, 66, 69]), (43, [62, 67, 71])]


def bed(a, b, vel=44, chords=MIN, every=2):
    s, i = a, 0
    while s < b - 0.2:
        root, tones = chords[i % 4]
        note(BS, root, s, BEAT * 1.4, vel + 16)
        if i % every == 0 or every == 1:
            for k, p in enumerate([tones[0], tones[1], tones[2], tones[1]]):
                note(MA, p, s + BEAT * (1 + k * 0.5), BEAT * 0.5, vel)
        s += BEAT * 4
        i += 1


def lean(a, b, vel=50):
    s = a
    while s < b - 0.2:
        note(CL, 50, s, BEAT * 1.6, vel)
        s += BEAT * 2


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    # Stop: one low hit + rope pull
    note(TI, 43, 0.2, 0.6, 92)
    chord(MA, [55, 62, 70], 0.2, 0.6, 62)
    lean(0.8, REEL, 42)
    bed(1.3, REEL, 36, every=2)
    # reel back: a quick marimba run down
    for j, p in enumerate([74, 70, 67, 62, 58, 55]):
        note(MA, p, REEL + j * 0.09, 0.14, 62)
    # at the desk
    bed(YOU, LEAVE, 38, every=1)
    # he leaves: the rope tightens
    bed(LEAVE, THEN, 42, every=1)
    lean(STAYS, THEN, 56)
    chord(ST, [50, 57], STAYS, 0.4, 62)
    # students: the bed thins and turns curious
    bed(THEN, WROTE, 36, every=2)
    note(GL, 79, THEN + 0.5, 0.5, 46)
    note(GL, 82, THEN + 1.2, 0.5, 46)
    # the note: only pizzicato + small ticks
    s = WROTE
    while s < SLAP - 0.3:
        note(BS, 43, s, BEAT * 0.8, 46)
        note(DRUMS, 76, s + BEAT, 0.06, 36)
        s += BEAT * 2
    # slap
    chord(ST, [43, 50], SLAP, 0.25, 74)
    # DROP: silence until 'let go'. Harp run up from 'let go' to 'better'
    n = 16
    for k in range(n):
        scale = [55, 57, 59, 60, 62, 64, 66, 67, 69, 71, 72, 74, 76, 78, 79, 83]
        at = LETGO + k * ((BETTER - 0.06 - LETGO) / n)
        note(HP, scale[k], at, 0.5, 58 + k * 3)
    # hit: G major
    note(TI, 43, BETTER, 0.9, 127)
    note(TI, 31, BETTER + 0.02, 1.1, 120)
    note(DRUMS, 49, BETTER, 2.0, 100)
    chord(BR, [43, 55, 62, 67, 71, 74], BETTER, 1.2, 106)
    chord(ST, [43, 55, 62, 67, 71, 74], BETTER, WRITE - BETTER - 0.3, 62)
    for j, p in enumerate([79, 83, 86, 91, 86, 91, 95]):
        note(GL, p, BETTER + 0.5 + j * 0.28, 0.5, 70)
    bed(BETTER + 2.0, WRITE, 46, chords=MAJ, every=1)
    # the action, quiet + major
    bed(WRITE, WRITE + 2.6, 36, chords=MAJ, every=2)
    # the question: back to minor, so it loops
    bed(WRITE + 3.0, END - 0.3, 34, every=2)
    lean(END - 1.2, END - 0.1, 42)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "h17-still-tied.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
