#!/usr/bin/env python3
"""Score for V032 "Can one cent change what you buy?" (v032-first-number).

A small evening shop in A minor, 112 BPM: nylon guitar + upright bass + wood block + a sitar answer in the gaps (different from H06's Eb Rhodes
and V030's D-minor pizzicato). The coin is a pair of high celesta notes. Silence from the end of 'one cent' to 'Now'. On 'only' rising strings
under the running crowd, then timpani + brass + cymbal on 'eighteen' (27.7 s), flute + sitar through the held picture. Soft A-minor guitar back at
the tag, so it loops into frame 0.
"""
import os

import mido

BPM = 112
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
GT, BS, CE, ST, BR, FL, TI, SI, DRUMS = 0, 1, 2, 3, 4, 5, 6, 7, 9
PROGRAMS = {GT: 24, BS: 32, CE: 8, ST: 48, BR: 61, FL: 73, TI: 47, SI: 104}
BEAT = 60 / BPM
COIN_P, BUILD, TEST, HIT1, HIT2, FLOOR, DROP, RUN, HIT, READ, END = 5.63, 7.9, 14.8, 24.27, 25.03, 25.8, 26.1, 27.3, 27.7, 31.97, 38.2
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


CH = [(45, [57, 60, 64]), (41, [57, 60, 65]), (43, [59, 62, 67]), (45, [57, 60, 64])]


def bed(a, b, vel=44, block=False):
    s, i = a, 0
    while s < b - 0.2:
        root, tones = CH[i % 4]
        note(BS, root, s, BEAT * 1.5, vel + 14)
        for k, p in enumerate([tones[0], tones[2], tones[1]]):
            note(GT, p, s + BEAT * (1 + k * 0.5), BEAT * 1.1, vel)
        if block:
            note(DRUMS, 76, s + BEAT * 2, 0.06, vel - 6)
        s += BEAT * 4
        i += 1


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    # Stop: one low hit, then the small shop
    note(TI, 45, 0.2, 0.6, 96)
    chord(GT, [45, 57, 64], 0.2, 1.0, 58)
    bed(1.3, COIN_P, 40)
    # coin: two high notes on 'coin', again when it is caught
    note(CE, 96, COIN_P, 0.3, 74)
    note(CE, 103, COIN_P + 0.14, 0.4, 66)
    note(CE, 100, 6.6, 0.3, 58)
    # a sitar answer in the pause, then the build
    for j, p in enumerate([69, 72, 76]):
        note(SI, p, 7.15 + j * 0.2, 0.3, 66)
    bed(BUILD, TEST - 0.1, 38, block=True)
    # the test room: a little more movement
    bed(TEST, HIT1 - 1.0, 44, block=True)
    for j, p in enumerate([76, 72, 69]):
        note(SI, p, 18.75 + j * 0.2, 0.3, 58)  # between the lines
    # two coin hits; the bed stops
    note(CE, 96, HIT1, 0.25, 92)
    note(CE, 103, HIT2, 0.25, 96)
    note(CE, 91, FLOOR, 0.2, 60)
    # DROP: silence until 'only'
    for k in range(5):
        at = RUN + k * ((HIT - 0.04 - RUN) / 5)
        chord(ST, [45 + k * 2, 57 + k * 2], at, 0.1, 74 + k * 8)
    # hit
    note(TI, 45, HIT, 0.9, 127)
    note(TI, 33, HIT + 0.02, 1.1, 120)
    note(DRUMS, 49, HIT, 2.0, 100)
    chord(BR, [45, 57, 64, 69, 72, 76], HIT, 1.2, 106)
    chord(ST, [45, 57, 64, 69, 72, 76], HIT, READ - HIT - 0.2, 66)
    for j, p in enumerate([76, 79, 81, 84, 88]):
        note(FL, p, HIT + 0.9 + j * 0.32, 0.5, 62)
    for j, p in enumerate([69, 72, 76, 81]):
        note(SI, p, HIT + 2.6 + j * 0.18, 0.4, 66)
    # the tag again: quiet
    bed(READ, END - 0.5, 38)
    note(CE, 96, END - 1.0, 0.4, 44)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "v032-first-number.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
