#!/usr/bin/env python3
"""Score for T17 "Why do you see 1 clock stop, when you look?" (t17-frozen-clock). Spark Got Tricked #4.

A comic end-of-day wait in D minor, 120 BPM so two beats = one clock second: tuba + clarinet + vibraphone (different from T36's guitar and marimba, T37's music box, T31's bassoon).
One held clarinet note over the stuck hook. Complete silence during the clock test, so no beat gives the viewer anything to compare with. A silent half second before the board,
a rising string swell while the bars grow, horns + timpani + glockenspiel on "second!". Ends on the held note of frame 0 so it loops.
"""
import os
import mido

BPM = 120
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
TU, CL, VB, ST, HN, TI, GL, PZ = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {TU: 58, CL: 71, VB: 11, ST: 48, HN: 60, TI: 47, GL: 9, PZ: 45}
PROMISE, TEST, TEST_END, BUT, RUN0, LAB, GROW2, HIT, EYES, FILL, RUN_BACK, Q, LOOP, END = 3.13, 5.0, 11.1, 13.2, 15.07, 16.0, 17.97, 18.93, 21.43, 23.33, 24.93, 25.6, 27.4, 28.3
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


def oompah(a, b, vel=44):
    s, i = a, 0
    roots = [38, 33, 34, 33]
    while s < b - 0.2:
        note(TU, roots[i % 4], s, 0.42, vel)
        note(TU, roots[i % 4] + 7, s + 1.0, 0.36, vel - 8)
        s += 2.0
        i += 1


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    # frame 0: the clock hangs, one held clarinet note over a low tuba
    note(CL, 69, 0.05, 2.9, 44)
    note(TU, 38, 0.05, 2.9, 40)
    # promise: two question notes + the wait starts
    oompah(PROMISE, TEST - 0.15, 42)
    note(CL, 69, PROMISE + 0.2, 0.4, 46)
    note(CL, 72, PROMISE + 0.7, 0.8, 46)
    # 5.0 to 11.1 s: nothing at all. This is the test.
    # He falls for it: the wait returns, then one hanging note on "too long"
    oompah(TEST_END + 0.1, 12.3, 40)
    note(CL, 74, 12.15, 1.0, 50)
    # the stopwatch: back to normal, ticking along
    oompah(BUT, RUN0 - 0.2, 42)
    for j, p in enumerate([69, 67, 65, 62]):
        note(CL, p, BUT + 0.1 + j * 0.45, 0.35, 44)
    # silence before the board, then a swell while the bars grow
    for j, (ps, vv) in enumerate([([26, 38], 34), ([26, 38, 45], 42), ([26, 38, 45, 50], 52), ([26, 38, 45, 50, 57], 62)]):
        chord(ST, ps, LAB + j * 0.74, 0.8, vv)
    for j, p in enumerate([62, 65, 69, 72, 74, 77]):
        note(VB, p, GROW2 - 0.2 + j * 0.2, 0.4, 44 + j * 5)
    # HIT on "second!"
    note(TI, 38, HIT, 0.9, 127)
    note(TI, 26, HIT + 0.02, 1.1, 112)
    chord(HN, [50, 57, 62, 65, 69], HIT, 1.6, 104)
    chord(ST, [38, 50, 57, 62, 69], HIT, EYES - HIT - 0.2, 58)
    for j, p in enumerate([74, 77, 81, 86, 81, 77]):
        note(GL, p, HIT + 0.4 + j * 0.32, 0.4, 62)
    # your eyes jump: one hop, then quiet thinking
    note(VB, 69, EYES + 0.5, 0.3, 54)
    note(VB, 76, EYES + 0.8, 0.5, 54)
    s = EYES + 1.5
    i = 0
    while s < RUN_BACK - 0.2:
        note(PZ, [38, 45, 41, 45][i % 4], s, 0.3, 36)
        s += 0.5
        i += 1
    for j, p in enumerate([74, 77, 81]):
        note(VB, p, FILL + j * 0.32, 0.5, 44)
    # back at the desk: the wait, lighter
    oompah(Q, LOOP - 0.1, 36)
    note(CL, 65, Q + 0.2, 0.4, 40)
    note(CL, 69, Q + 1.0, 0.6, 42)
    # back to frame 0: the same held note
    note(CL, 69, LOOP, END - LOOP, 42)
    note(TU, 38, LOOP, END - LOOP, 38)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "t17-frozen-clock.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
