#!/usr/bin/env python3
"""Score for H06 "How many stairs a day help your heart?" (h06-fifty-steps).

A climb in E-flat, 108 BPM: Rhodes + soft bass, a glockenspiel note for the steps that rises as Spark climbs (different from V030's
D-minor pizzicato + bassoon and H30's A-major marimba). Silence + a heartbeat from the end of 'nothing clearly changed' to 'But'.
Strings rise on the last flight, half-second hush, then taiko + brass + cymbal when the block smashes on the street (24.4 s).
Warm pad + flute through the held picture. Falling glockenspiel on the slide down. Quiet Rhodes back in the lobby, so it loops.
"""
import os

import mido

BPM = 108
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
RH, BS, GL, ST, BR, FL, TK, DRUMS = 0, 1, 2, 3, 4, 5, 6, 9
PROGRAMS = {RH: 4, BS: 33, GL: 9, ST: 48, BR: 61, FL: 73, TK: 116}
BEAT = 60 / BPM
CLIMB0, DROP, BUT, HUSH, LAND, CAV, SL0, SL1, END = 15.6, 19.65, 20.7, 23.85, 24.4, 26.8, 30.67, 31.9, 37.13
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


CH = [(39, [63, 67, 70]), (44, [63, 68, 72]), (46, [65, 70, 74]), (39, [63, 67, 70])]


def bed(a, b, vel=44):
    s, i = a, 0
    while s < b - 0.2:
        root, tones = CH[i % 4]
        note(BS, root, s, BEAT * 1.6, vel + 12)
        chord(RH, tones, s + BEAT, BEAT * 2.2, vel)
        s += BEAT * 4
        i += 1


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    note(DRUMS, 36, 0.2, 0.2, 66)
    chord(RH, [63, 67, 70], 0.2, 0.9, 50)
    bed(1.2, CLIMB0 - 0.1, 42)
    # the climb: one rising glockenspiel note for every few steps, steady pulse
    bed(CLIMB0, DROP, 50)
    scale = [75, 77, 79, 80, 82, 84, 86, 87, 89, 91, 92, 94, 96, 98, 99, 101, 103]
    n = int((DROP - 0.15 - CLIMB0) / 0.24)
    for k in range(n):
        note(GL, scale[min(k, len(scale) - 1)], CLIMB0 + k * 0.24, 0.2, 52 + k)
        if k % 2 == 0:
            note(DRUMS, 42, CLIMB0 + k * 0.24, 0.08, 40)
    # DROP: silence, only a low heartbeat
    for at in [DROP + 0.2, DROP + 0.55]:
        note(DRUMS, 36, at, 0.15, 60)
    # last flight: strings rise, glock continues above fifty
    n = 12
    for k in range(n):
        at = BUT + k * ((HUSH - 0.2 - BUT) / n)
        prog = k / n
        chord(ST, [46 + k, 58 + k], at, 0.3, 38 + 44 * prog)
        note(GL, 87 + k, at, 0.2, 58 + 22 * prog)
    # hush, then the hit
    note(TK, 40, LAND, 0.9, 124)
    note(TK, 36, LAND + 0.02, 1.1, 118)
    note(DRUMS, 49, LAND, 2.0, 96)
    note(DRUMS, 57, LAND + 0.02, 1.8, 78)
    chord(BR, [39, 51, 58, 63, 67, 70], LAND, 1.4, 104)
    chord(ST, [39, 51, 58, 63, 67, 70, 75], LAND, CAV - LAND - 0.1, 64)
    for j, p in enumerate([82, 84, 87, 91]):
        note(FL, p, LAND + 0.8 + j * 0.34, 0.5, 60)
    # caveat + slide: quiet
    bed(CAV, SL0 - 0.1, 36)
    for k in range(16):
        note(GL, 101 - k * 2, SL0 + k * ((SL1 - SL0 - 0.05) / 16), 0.1, 70 - k)
    note(DRUMS, 36, SL1 - 0.04, 0.2, 58)
    bed(SL1 + 0.1, END - 0.5, 40)
    note(GL, 87, END - 1.0, 0.6, 44)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "h06-fifty-steps.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
