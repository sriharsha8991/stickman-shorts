#!/usr/bin/env python3
"""Score for T31 "Why do you never sound right on recordings?" (t31-voice-note). Spark Got Tricked #1.

A small comic living room in F, 100 BPM: bassoon + pizzicato, a felt piano note here and there (different from H17's G-minor marimba and V032's nylon
guitar). Almost nothing while the thin voice note plays. F minor when the phone is stolen. Clarinet asks a question over the sheet. Silence from the
eraser until 'part!', then F major: timpani, muted brass, glockenspiel, through the held picture. Quiet at the end, back to the opening note so it loops.
"""
import os

import mido

BPM = 100
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
BN, PZ, PN, CL, ST, BR, GL, TI, HP = 0, 1, 2, 3, 4, 5, 6, 7, 8
PROGRAMS = {BN: 70, PZ: 45, PN: 0, CL: 71, ST: 48, BR: 59, GL: 9, TI: 47, HP: 46}
BEAT = 60 / BPM
PROMISE, SEND, PLAYBACK, STOLEN, ROLL, DROP, PART, OTHER, Q, LOOP, END = 3.8, 6.13, 8.93, 11.6, 12.97, 16.0, 18.87, 20.77, 24.43, 26.2, 27.2
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


MAJ = [(41, [60, 65, 69]), (46, [62, 65, 70]), (48, [60, 64, 67]), (41, [60, 65, 69])]
MIN = [(41, [60, 65, 68]), (37, [61, 65, 68]), (36, [60, 64, 67]), (41, [60, 65, 68])]


def walk(a, b, vel=44, chords=MAJ, pizz=True):
    s, i = a, 0
    while s < b - 0.2:
        root, tones = chords[i % 4]
        note(BN, root, s, BEAT * 0.8, vel + 8)
        note(BN, root + 7, s + BEAT * 2, BEAT * 0.8, vel)
        if pizz:
            for k in (1, 3):
                chord(PZ, tones, s + BEAT * k, BEAT * 0.5, vel - 6)
        s += BEAT * 4
        i += 1


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    # frame 0: a surprised chord
    chord(PN, [53, 60, 68], 0.1, 1.2, 58)
    note(BN, 41, 0.1, 0.9, 60)
    note(PN, 72, 1.6, 0.5, 38)
    note(PN, 68, 2.4, 0.5, 34)
    # promise + voice note: he is proud
    walk(PROMISE, PLAYBACK - 0.25, 40)
    for j, p in enumerate([72, 74, 77]):
        note(GL, p, SEND + 1.4 + j * 0.2, 0.3, 40)
    # the thin voice note: nothing but one small high note after it
    note(PN, 85, PLAYBACK + 1.45, 0.3, 26)
    # stolen phone: F minor
    walk(PLAYBACK + 1.5, ROLL - 0.1, 42, MIN)
    chord(ST, [41, 48], STOLEN, 0.3, 66)
    # the sheet: harp down with the roll, clarinet asks
    for j, p in enumerate([84, 81, 77, 74, 72, 69, 65, 62]):
        note(HP, p, ROLL + j * 0.08, 0.4, 50)
    walk(ROLL + 0.7, DROP - 0.1, 36, MAJ, pizz=False)
    note(CL, 72, ROLL + 1.0, 0.7, 48)
    note(CL, 74, ROLL + 1.8, 0.7, 50)
    note(CL, 77, ROLL + 2.5, 0.5, 52)
    # DROP: silence except a low plucked tick under the eraser line, then a harp run into the hit
    n = 12
    for k in range(n):
        sc = [53, 55, 57, 58, 60, 62, 64, 65, 67, 69, 70, 72]
        note(HP, sc[k], PART - 0.7 + k * (0.66 / n), 0.5, 52 + k * 4)
    # HIT: F major
    note(TI, 41, PART, 0.9, 127)
    note(TI, 29, PART + 0.02, 1.1, 118)
    chord(BR, [41, 53, 60, 65, 69, 72], PART, 0.9, 104)
    chord(ST, [41, 53, 60, 65, 69, 72], PART, OTHER - PART + 0.6, 60)
    for j, p in enumerate([77, 81, 84, 89, 84, 89, 93]):
        note(GL, p, PART + 0.4 + j * 0.24, 0.45, 66)
    # the last part: warm, thin bed under the voice
    walk(OTHER + 0.2, Q - 0.2, 34, MAJ)
    # question, quiet
    note(BN, 41, Q, 1.0, 40)
    note(PN, 72, Q + 0.9, 0.5, 32)
    # loop back: the opening chord's bass
    note(BN, 48, LOOP - 0.1, 0.6, 46)
    note(BN, 41, LOOP + 0.5, 0.5, 46)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "t31-voice-note.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
