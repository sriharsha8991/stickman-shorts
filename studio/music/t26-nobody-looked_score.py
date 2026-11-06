#!/usr/bin/env python3
"""Score for T26 "Why do you think everyone saw your 1 mistake?" (t26-nobody-looked). Spark Got Tricked #5.

Lift music: a soft bossa in Bb major, 96 BPM, Rhodes + upright bass + muted trumpet (different from T17's tuba and clarinet, T36's guitar and marimba, T37's music box, T31's bassoon).
It starts awkward: one held sour chord under the staring eyes. Low strings grow while the room stares, complete silence for the switch, three pizzicato steps on "one in four",
brass + timpani + glockenspiel on "noticed". Then the same lift music, now light. Ends on the sour chord of frame 0 so it loops.
"""
import os
import mido

BPM = 96
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
RH, BS, TP, ST, BR, TI, GL, PZ = 0, 1, 2, 3, 4, 5, 6, 7
PROGRAMS = {RH: 4, BS: 32, TP: 59, ST: 48, BR: 61, TI: 47, GL: 9, PZ: 45}
PROMISE, MOVE, ROOM, GUESS, STOP, CLICK, ONE, IN, FOUR, HIT, CENTRE, RUN, HOME, SMALLER, Q, LOOP, END = 3.4, 7.2, 7.9, 12.0, 14.87, 15.97, 16.77, 16.97, 17.2, 17.43, 20.37, 23.2, 23.9, 25.33, 27.73, 29.47, 30.5
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
CHANGES = [(34, [58, 62, 65, 69]), (31, [55, 58, 62, 65]), (36, [60, 63, 67, 70]), (29, [57, 60, 63, 67])]


def bossa(a, b, vel=44, comp=38):
    """soft lift music: bass root + fifth, off-beat Rhodes stabs"""
    s, i = a, 0
    while s < b - 0.3:
        root, ch = CHANGES[i % 4]
        for off, step, l in [(0, 0, 1.3), (1.5, 7, 0.45), (2, 7, 1.3), (3.5, 0, 0.45)]:
            at = s + off * BEAT
            if at < b - 0.1:
                note(BS, root + step, at, l * BEAT, vel - (6 if off % 2 else 0))
        for off in [0.5, 1.5, 3, 3.5]:
            at = s + off * BEAT
            if at < b - 0.1:
                chord(RH, ch, at, 0.42 * BEAT, comp)
        s += 4 * BEAT
        i += 1


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    # frame 0: one sour held chord, a little trumpet slide down
    chord(RH, [58, 61, 64, 69], 0.05, 3.1, 40)
    note(BS, 34, 0.05, 3.1, 42)
    note(TP, 70, 1.5, 0.55, 40)
    note(TP, 69, 2.05, 1.0, 38)
    # the promise: the lift music starts, very quiet
    bossa(PROMISE, MOVE, 36, 30)
    note(TP, 74, 5.2, 0.4, 42)
    note(TP, 77, 5.65, 0.8, 42)
    # the room: the music stops being cosy, a single bass pulse + strings that grow as the eyes open
    s = ROOM
    while s < STOP - 0.1:
        note(BS, 29, s, 0.35, 42)
        s += 2 * BEAT
    for j, (ps, vv) in enumerate([([41, 53], 28), ([41, 53, 60], 36), ([41, 53, 60, 63], 44), ([41, 53, 60, 63, 66], 56), ([41, 53, 60, 63, 66, 71], 66)]):
        chord(ST, ps, GUESS - 1.2 + j * 0.82, 0.86, vv)
    # 14.87 to 15.97 s: nothing at all, then the switch. Three steps up on "one in four".
    for at, p in [(ONE, 70), (IN, 74), (FOUR, 77)]:
        note(PZ, p, at, 0.3, 74)
        note(RH, p - 12, at, 0.3, 42)
    # HIT on "noticed"
    note(TI, 34, HIT, 0.9, 127)
    note(TI, 22, HIT + 0.02, 1.1, 112)
    chord(BR, [46, 58, 65, 70, 74], HIT, 1.5, 106)
    chord(ST, [34, 46, 58, 65, 70, 74], HIT, CENTRE - HIT - 0.15, 56)
    for j, p in enumerate([82, 86, 89, 94, 89, 86]):
        note(GL, p, HIT + 0.35 + j * 0.3, 0.4, 60)
    # everybody has their own worry: the lift music, light now
    bossa(CENTRE, RUN + 0.05, 42, 36)
    bossa(HOME, Q, 40, 34)
    note(TP, 77, CENTRE + 1.6, 0.4, 42)
    note(TP, 79, CENTRE + 2.1, 0.8, 42)
    # the stain shrinks: glockenspiel falls
    for j, p in enumerate([94, 91, 89, 86, 82, 77]):
        note(GL, p, SMALLER + j * 0.13, 0.3, 56 - j * 2)
    # the question: two calm Rhodes chords, one up
    chord(RH, [58, 62, 65, 69], Q, 0.8, 38)
    note(BS, 34, Q, 0.8, 40)
    chord(RH, [60, 63, 67, 70], Q + 0.85, 0.8, 38)
    note(BS, 36, Q + 0.85, 0.8, 40)
    # back to frame 0
    chord(RH, [58, 61, 64, 69], LOOP, END - LOOP, 40)
    note(BS, 34, LOOP, END - LOOP, 42)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "t26-nobody-looked.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
