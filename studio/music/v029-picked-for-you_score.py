#!/usr/bin/env python3
"""Score for V029 "Who picks what you watch?" (v029-picked-for-you).

A small restaurant waltz, 3/4, G major, 132 BPM, accordion + nylon guitar + upright bass (different from H16's Bb 4/4 office
jazz): sparse oom-pah-pah under the voice, a little accordion answer in the gaps. Kitchen (from the "But" at 12.27 s): the
same waltz moves to E minor with soft low clarinet. Belt stops in the pause: a DROP of silence (19.9-21.3 s). The number:
one soft tick-like celesta note per lit tile, low strings growing. Door up at "computer" (25.5+ s): brass + timpani + cymbal
in G, then a held warm chord with glockenspiel through the 1.9 s pause. Action (29.5 s): the waltz returns, lighter, to loop.
"""
import os

import mido

BPM = 132
TPB = 480
SEC = TPB * BPM / 60
BEAT = 60 / BPM
BAR = 3 * BEAT
HERE = os.path.dirname(os.path.abspath(__file__))

ACC, GTR, BASS, CLAR, STR, BRASS, GLOCK, CELE, TIMP, DRUMS = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
PROGRAMS = {ACC: 21, GTR: 24, BASS: 32, CLAR: 71, STR: 48, BRASS: 61, GLOCK: 9, CELE: 8, TIMP: 47}

KITCHEN = 12.0
DROP = 19.95
NUMBER = 21.27
TILES = 23.2
HIT = 25.67
ACTION = 29.3
END = 34.9
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, pitch, start_s, dur_s, vel):
    a, b = t(start_s), t(start_s + dur_s)
    events.append((a, 1, mido.Message("note_on", channel=ch, note=pitch, velocity=max(1, min(127, vel)))))
    events.append((b, 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


CH = {
    "G": (43, [59, 62, 67]),
    "C": (36, [60, 64, 67]),
    "D": (38, [57, 62, 66]),
    "Em": (40, [59, 64, 67]),
    "Am": (45, [57, 60, 64]),
    "B7": (47, [59, 63, 66]),
}


def waltz(s0, name, soft=0):
    root, v = CH[name]
    note(BASS, root, s0, BEAT * 0.9, 62 - soft)
    chord(GTR, v, s0 + BEAT, BEAT * 0.5, 40 - soft)
    chord(GTR, v, s0 + 2 * BEAT, BEAT * 0.5, 36 - soft)
    chord(ACC, v, s0 + BEAT, BEAT * 1.7, 22 - soft // 2)
    note(DRUMS, 70, s0 + BEAT, 0.05, 16)
    note(DRUMS, 70, s0 + 2 * BEAT, 0.05, 14)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {ACC: 92, GTR: 96, BASS: 100, CLAR: 78, STR: 88, BRASS: 106, GLOCK: 80, CELE: 86, TIMP: 104, DRUMS: 60}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch, pan in {ACC: 48, GTR: 78, CLAR: 44, GLOCK: 78}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=10, value=pan)))
    for ch in (ACC, STR, CLAR, BRASS, GLOCK, CELE):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=58)))

    s, i = 0.0, 0
    for_prog = ["G", "G", "C", "G", "D", "D", "G", "G"]
    while s + BAR <= KITCHEN:
        waltz(s, for_prog[i % 8], soft=4 if s < 3.5 else 0)
        s += BAR
        i += 1
    # accordion answers in the gaps (after the promise; after "choice")
    for st, ps in [(5.75, [71, 74, 79, 74]), (11.9, [76, 74, 71])]:
        for j, p in enumerate(ps):
            note(ACC, p, st + j * BEAT, BEAT * 0.9, 58)

    prog2 = ["Em", "Am", "B7", "Em", "C", "B7"]
    i = 0
    while s + BAR <= DROP:
        waltz(s, prog2[i % 6], soft=2)
        root, v = CH[prog2[i % 6]]
        note(CLAR, v[1] - 12, s, BAR * 0.95, 26)
        s += BAR
        i += 1
    # DROP: silence (keep the ring of the last chord short)

    # the number: strings grow, one celesta note per tile
    chord(STR, [40, 47, 52], NUMBER, HIT - NUMBER - 0.05, 38)
    for j, p in enumerate([76, 79, 83, 84, 86, 88, 91]):
        note(CELE, p, TILES + j * (5 / 30), 0.4, 64)
    r = HIT - 1.2
    while r < HIT:
        k = (r - (HIT - 1.2)) / 1.2
        note(TIMP, 43, r, 0.09, int(26 + 56 * k))
        r += 0.09

    # the door goes up
    chord(BRASS, [43, 55, 59, 62, 67, 71], HIT, 1.1, 100)
    chord(STR, [43, 55, 59, 62, 67, 71, 74], HIT, ACTION - HIT - 0.1, 64)
    note(TIMP, 43, HIT, 0.5, 112)
    note(DRUMS, 49, HIT, 1.5, 84)
    note(DRUMS, 36, HIT, 0.3, 90)
    for j, p in enumerate([79, 83, 86, 91]):
        note(GLOCK, p, HIT + 0.35 + j * 0.16, 0.7, 60)
    # a little waltz figure in the 1.9 s hold
    for j, p in enumerate([74, 79, 83]):
        note(ACC, p, HIT + 1.9 + j * BEAT, BEAT * 0.9, 56)

    s = ACTION
    i = 0
    while s + BAR <= END + 0.5:
        waltz(s, ["G", "C", "D", "G"][i % 4], soft=6)
        s += BAR
        i += 1

    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    last = 0
    for at, _, m in events:
        tr.append(m.copy(time=at - last))
        last = at
    mid.save(os.path.join(HERE, "v029-picked-for-you.mid"))


if __name__ == "__main__":
    main()
