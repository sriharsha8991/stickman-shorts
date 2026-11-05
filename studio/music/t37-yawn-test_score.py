#!/usr/bin/env python3
"""Score for T37 "Did you just yawn because of this?" (t37-yawn-test). Spark Got Tricked #2.

A sleepy after-lunch lullaby in C, 3/4 at 66 BPM: music box + harp + upright bass (different from T31's bassoon and pizzicato in F).
Nearly silent during the 3 s yawn so the breath is heard. Soft flute for the study, silence for the drop, harp run, then a warm trombone + tuba chord with
timpani and glockenspiel on "yawned!". A low sly pizzicato for the heart, a falling trombone on "weak". Ends on the opening chord so it loops.
"""
import os
import mido

BPM = 66
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
MB, HP, BS, FL, PZ, TB, TU, GL, TI, ST = 0, 1, 2, 3, 4, 5, 6, 7, 8, 10
PROGRAMS = {MB: 10, HP: 46, BS: 32, FL: 73, PZ: 45, TB: 57, TU: 58, GL: 9, TI: 47, ST: 89}
BEAT = 60 / BPM
PROMISE, WATCH, TEST, FEEL, DROP, STUDY, HIT, MANY, WEAK, Q, LOOP, END = 3.63, 5.97, 8.93, 12.07, 13.87, 14.67, 17.47, 19.4, 22.5, 23.5, 25.8, 26.87
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


BAR = [(36, [64, 67, 72]), (41, [65, 69, 72]), (43, [62, 67, 71]), (36, [64, 67, 72])]
TUNE = [76, 72, 67, 69, 72, 65, 74, 71, 67, 72, 76, 79]


def lullaby(a, b, vel=44, box=True):
    s, i, n = a, 0, 0
    while s < b - 0.3:
        root, tones = BAR[i % 4]
        note(BS, root, s, BEAT * 1.6, vel + 8)
        for k in (1, 2):
            chord(HP, tones, s + BEAT * k, BEAT * 0.9, vel - 14)
        if box:
            note(MB, TUNE[n % len(TUNE)], s, BEAT * 1.4, vel + 2)
            note(MB, TUNE[(n + 1) % len(TUNE)], s + BEAT * 2, BEAT * 0.9, vel - 6)
            n += 2
        s += BEAT * 3
        i += 1


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    # frame 0: a long sleepy chord
    chord(ST, [48, 55, 64], 0.05, 2.6, 46)
    note(MB, 79, 0.1, 1.0, 44)
    # hook + promise: the lullaby starts
    lullaby(0.9, WATCH - 0.1, 42)
    # Mr. Trick's yawn: flute slides down
    for j, p in enumerate([79, 76, 72, 69]):
        note(FL, p, WATCH + 0.7 + j * 0.42, 0.5, 42 - j * 3)
    lullaby(WATCH + 0.3, TEST - 0.2, 32, box=False)
    # THE TEST: one very low held note, nothing else
    note(ST, 36, TEST, FEEL - TEST - 0.2, 26)
    # he lost: two slow tuba notes down
    note(TU, 43, FEEL - 0.15, 0.6, 46)
    note(TU, 36, FEEL + 0.5, 0.9, 42)
    # the wall screen + the study: very sparse, then the first opened mouths one box note each
    for s0, p in [(15.9, 72), (16.33, 76), (16.8, 79)]:
        note(MB, p, s0, 0.5, 44)
    # harp run into the hit
    run = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83]
    for k, p in enumerate(run):
        note(HP, p, HIT - 0.62 + k * (0.6 / len(run)), 0.5, 48 + k * 3)
    # HIT
    note(TI, 36, HIT, 0.9, 127)
    note(TI, 31, HIT + 0.02, 1.1, 115)
    chord(TB, [48, 55, 60, 64], HIT, 1.6, 104)
    note(TU, 36, HIT, 1.8, 104)
    chord(ST, [48, 55, 60, 64, 72], HIT, MANY - HIT, 60)
    for j, p in enumerate([84, 88, 91, 96, 91, 96]):
        note(GL, p, HIT + 0.35 + j * 0.28, 0.45, 62)
    # the heart: low sly pizzicato
    s = MANY + 0.2
    i = 0
    while s < WEAK - 0.5:
        note(PZ, [36, 43, 41, 43][i % 4], s, 0.4, 44)
        s += BEAT
        i += 1
    # weak: trombone falls
    for j, p in enumerate([60, 58, 56, 53, 50]):
        note(TB, p, WEAK - 0.5 + j * 0.2, 0.28, 62 - j * 4)
    # the question, quiet
    lullaby(Q, LOOP - 0.1, 30)
    # back to frame 0
    chord(ST, [48, 55, 64], LOOP, 1.2, 38)
    note(MB, 79, END - 0.6, 0.6, 34)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "t37-yawn-test.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
