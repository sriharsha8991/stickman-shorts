#!/usr/bin/env python3
"""Score for T11 "Why do your 2 fingers feel what is never there?" (t11-crossed-fingers). Spark Got Tricked #6.

A small after-dinner tune in G major, 92 BPM: felt piano + accordion + pizzicato bass + a flute that answers (different from T26's bossa, T17's tuba, T36's guitar, T37's music box).
The bed thins out on the test (almost silent: the viewer must feel their fingers), comes back on the question, a harp-like rise as the fingers uncross, timpani + glockenspiel on "things!",
half a second of silence, then brass + timpani + glockenspiel on the second "things." It ends on the G chord of frame 0 so it loops.
"""
import os
import mido

BPM = 92
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
PN, AC, BS, FL, BR, TI, GL, HP = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {PN: 0, AC: 21, BS: 45, FL: 73, BR: 61, TI: 47, GL: 9, HP: 46}
FPS = 30
TEST0, TEST1, NORMAL, UNCROSS, HIT, SO, DROP, HIT2, Q, LOOP, END = 365 / FPS, 455 / FPS, 551 / FPS, 611 / FPS, 654 / FPS, 689 / FPS, 753 / FPS, 768 / FPS, 838 / FPS, 896 / FPS, 927 / FPS
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


BEAT = 60 / BPM
CHANGES = [(43, [59, 62, 67]), (38, [57, 62, 66]), (40, [59, 64, 67]), (36, [60, 64, 67])]


def bed(a, b, vel=46, comp=36, flute=False):
    """bass on 1 and 3, soft piano off-beats, a long accordion chord"""
    s, i = a, 0
    while s < b - 0.3:
        root, ch = CHANGES[i % 4]
        note(BS, root, s, 0.8 * BEAT, vel)
        if s + 2 * BEAT < b - 0.1:
            note(BS, root + 7, s + 2 * BEAT, 0.8 * BEAT, vel - 6)
        for off in [1, 3]:
            at = s + off * BEAT
            if at < b - 0.1:
                chord(PN, ch, at, 0.6 * BEAT, comp)
        chord(AC, ch, s, min(3.8 * BEAT, b - s), comp - 12)
        if flute:
            note(FL, ch[2] + 12, s + 3.5 * BEAT, 0.4 * BEAT, 34)
        s += 4 * BEAT
        i += 1


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    # frame 0: a question on the flute over one chord
    chord(PN, [55, 59, 62, 67], 0.03, 1.2, 44)
    note(BS, 43, 0.03, 1.2, 50)
    note(FL, 74, 0.5, 0.5, 42)
    note(FL, 76, 1.05, 0.5, 42)
    note(FL, 78, 1.6, 1.0, 44)
    bed(3.3, TEST0 - 0.1, flute=True)
    # the test: only a very quiet held accordion note, so the viewer feels the fingers
    note(AC, 62, TEST0, TEST1 - TEST0, 18)
    # the question + the search
    bed(TEST1, NORMAL - 0.2, vel=40, comp=30)
    # the fingers uncross: slow rising notes
    for i, p in enumerate([62, 66, 69, 74, 78, 81, 86]):
        note(HP, p, NORMAL + 0.4 + i * (HIT - NORMAL - 0.5) / 7, 0.7, 40 + i * 3)
    # "things!"
    note(TI, 43, HIT, 0.5, 92)
    chord(BR, [55, 62, 67], HIT, 0.5, 60)
    for i, p in enumerate([79, 83, 86]):
        note(GL, p, HIT + i * 0.1, 0.5, 70)
    # the fingers cross again: low, waiting, then a silence on the last words
    bed(SO, DROP, vel=38, comp=26)
    # DROP: half a second of nothing, HIT2: the biggest moment
    note(TI, 43, HIT2, 0.35, 104)
    note(TI, 50, HIT2 + 0.2, 0.5, 92)
    chord(BR, [43, 50, 55, 62, 67, 71, 74], HIT2, 1.5, 88)
    chord(AC, [55, 59, 62, 67], HIT2, 2.0, 48)
    for i, p in enumerate([79, 83, 86, 91, 95]):
        note(GL, p, HIT2 + i * 0.11, 0.7, 78)
    # the last line, light
    bed(Q, LOOP, vel=40, comp=32, flute=True)
    chord(PN, [55, 59, 62, 67], LOOP, END - LOOP, 42)
    note(BS, 43, LOOP, END - LOOP, 46)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "t11-crossed-fingers.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
