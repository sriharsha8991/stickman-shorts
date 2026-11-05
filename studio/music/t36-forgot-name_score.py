#!/usr/bin/env python3
"""Score for T36 "Why do you lose 1 name right after hearing it?" (t36-forgot-name). Spark Got Tricked #3.

A slightly awkward first-day office groove in E minor, 104 BPM: nylon guitar, marimba, plucked bass (different from T37's waltz lullaby and T31's bassoon).
One rising marimba note per person as the turn goes round the table, two falling notes when the names fall. Silence for the drop, a low string swell under the
answer, then timpani + muted brass + celesta on "turn!". Ends on the opening chord so it loops.
"""
import os
import mido

BPM = 104
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
GT, MR, BS, ST, BR, TI, CE, PZ = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {GT: 24, MR: 12, BS: 32, ST: 48, BR: 59, TI: 47, CE: 8, PZ: 45}
BEAT = 60 / BPM
PROMISE, ROUND1, BUSY, SWEEP, MYTURN, TEST, DROP, ANSWER, HIT, CAVEAT, NAMES, Q, LOOP, END = 3.53, 5.73, 8.87, 11.03, 11.43, 12.3, 16.1, 17.1, 19.9, 22.3, 24.7, 26.2, 28.3, 29.37
R1 = [5.73, 6.6, 7.13, 7.8]
R2 = [13.67, 14.27, 14.87, 15.4, 15.97]
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


BARS = [(40, [59, 64, 67]), (36, [60, 64, 67]), (38, [62, 66, 69]), (35, [59, 63, 66])]


def groove(a, b, vel=40):
    s, i = a, 0
    while s < b - 0.3:
        root, tones = BARS[i % 4]
        note(BS, root, s, BEAT * 0.9, vel + 12)
        note(BS, root + 7, s + BEAT * 2, BEAT * 0.8, vel + 4)
        for off in (1, 2.5, 3):
            if s + BEAT * off < b:
                chord(GT, tones, s + BEAT * off, BEAT * 0.4, vel - 6)
        s += BEAT * 4
        i += 1


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    # frame 0: the awkward chord
    chord(GT, [52, 59, 64, 67], 0.05, 1.4, 56)
    note(BS, 40, 0.05, 1.2, 60)
    groove(1.15, PROMISE - 0.1, 38)
    # promise: two question notes
    note(MR, 71, PROMISE + 0.1, 0.4, 50)
    note(MR, 74, PROMISE + 0.55, 0.6, 50)
    # the names go round: a rising note per person
    groove(ROUND1, BUSY - 0.1, 34)
    for s, p in zip(R1, [64, 67, 71, 74]):
        note(MR, p, s, 0.5, 66)
    # he plans his line: only a small repeating figure, the names fall
    for j in range(5):
        note(MR, 76 if j % 2 else 79, BUSY + 0.2 + j * BEAT, 0.3, 34)
    for s, p in [(9.9, 71), (10.37, 67)]:
        note(PZ, p - 12, s + 0.5, 0.4, 62)
    # swept into the bin + his proud turn
    note(BS, 47, SWEEP + 0.1, 0.3, 50)
    chord(GT, [52, 59, 64, 71], MYTURN, 0.7, 54)
    # the word test: same round, drier
    groove(TEST, DROP - 0.1, 28)
    for s, p in zip(R2, [64, 67, 71, 74, 79]):
        note(MR, p, s, 0.45, 64)
    # DROP: silence, then a low swell under the answer
    for j, (ps, vv) in enumerate([([28, 40], 34), ([28, 40, 47], 44), ([28, 40, 47, 52], 56)]):
        chord(ST, ps, ANSWER + j * 0.92, 1.0, vv)
    for j in range(4):
        note(PZ, 40, ANSWER + 0.1 + j * 0.7, 0.2, 44 + j * 6)
    # HIT on "turn!"
    note(TI, 40, HIT, 0.9, 127)
    note(TI, 28, HIT + 0.02, 1.1, 112)
    chord(BR, [52, 59, 64, 67], HIT, 1.5, 100)
    chord(ST, [40, 52, 59, 64, 71], HIT, CAVEAT - HIT - 0.2, 58)
    for j, p in enumerate([76, 79, 83, 88, 83, 79]):
        note(CE, p, HIT + 0.4 + j * 0.3, 0.45, 62)
    # the caveat: thin and thoughtful
    s = CAVEAT + 0.1
    i = 0
    while s < NAMES:
        note(PZ, [40, 47, 43, 47][i % 4], s, 0.3, 38)
        s += BEAT
        i += 1
    chord(GT, [55, 59, 62, 67], NAMES, 1.1, 46)
    # the question
    groove(Q, LOOP - 0.1, 30)
    note(MR, 71, LOOP - 0.5, 0.4, 44)
    note(MR, 74, LOOP - 0.1, 0.5, 44)
    # back to frame 0
    chord(GT, [52, 59, 64, 67], LOOP + 0.2, 0.9, 46)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "t36-forgot-name.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
