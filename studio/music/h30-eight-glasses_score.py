#!/usr/bin/env python3
"""Score for H30 "Who told you that you need eight glasses?" (h30-eight-glasses).

Playful kitchen bounce, 4/4, A major, 124 BPM, marimba + pizzicato + light shaker (different from V029's G-major waltz and
H16's Bb jazz). Sparse under the voice; little marimba answers in the gaps. Report (9.5 s): pizzicato alone, curious, F#m.
Pull on the cord: silence, the half-second DROP at 15.4-16.1 s, the page unrolls on a soft riser, hit on "food" (17.97 s):
strings + brass + timpani in A, marimba runs up while the water pours. "Experts" (19.67 s): back to a thinking pizzicato in
F#m. Drinks (22.7 s): rising strings; the big hit on "tea" (24.67 s), held through the 1.8 s pause with glockenspiel.
Thirst (26.9 s): the opening bounce returns, lighter, so it loops into frame 0.
"""
import os

import mido

BPM = 124
TPB = 480
SEC = TPB * BPM / 60
BEAT = 60 / BPM
BAR = 4 * BEAT
HERE = os.path.dirname(os.path.abspath(__file__))

MAR, PIZ, BASS, STR, BRASS, GLOCK, TIMP, DRUMS = 0, 1, 2, 3, 4, 5, 6, 9
PROGRAMS = {MAR: 12, PIZ: 45, BASS: 32, STR: 48, BRASS: 61, GLOCK: 9, TIMP: 47}

REPORT = 9.3
DROP0 = 15.4
PAGE = 16.1
FOOD = 17.97
EXPERTS = 19.5
DRINKS = 22.7
TEA = 24.67
THIRST = 26.7
END = 36.6
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
    "A": (45, [57, 61, 64]),
    "D": (38, [57, 62, 66]),
    "E": (40, [56, 59, 64]),
    "F#m": (42, [57, 61, 66]),
    "Bm": (47, [59, 62, 66]),
}


def bounce(s0, name, soft=0, answer=False):
    root, tones = CH[name]
    note(BASS, root, s0, BEAT * 0.8, 62 - soft)
    note(BASS, root + 7, s0 + 2 * BEAT, BEAT * 0.7, 54 - soft)
    note(MAR, tones[0] + 12, s0 + BEAT, BEAT * 0.4, 50 - soft)
    note(MAR, tones[1] + 12, s0 + 3 * BEAT, BEAT * 0.4, 48 - soft)
    note(DRUMS, 69, s0 + BEAT, 0.08, 26 - soft // 2)
    note(DRUMS, 69, s0 + 3 * BEAT, 0.08, 26 - soft // 2)
    if answer:
        for j, p in enumerate([tones[2] + 12, tones[1] + 24, tones[2] + 24]):
            note(MAR, p, s0 + 3.5 * BEAT + j * BEAT / 2, BEAT * 0.4, 60 - soft)


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))

    # hit on "Stop"
    note(DRUMS, 36, 0.2, 0.2, 76)
    chord(MAR, [69, 73, 76], 0.2, 0.3, 74)
    # eight little marimba notes as the glasses pop in
    for j, p in enumerate([69, 71, 73, 74, 76, 78, 80, 81]):
        note(MAR, p, 2.0 + j * 0.1, 0.12, 54)

    s = 3.1
    i = 0
    while s + BAR <= REPORT + 0.1:
        bounce(s, ["A", "D", "E", "A"][i % 4], soft=6, answer=i % 2 == 1)
        s += BAR
        i += 1

    # the old report: pizzicato alone, curious
    s = REPORT
    i = 0
    while s < DROP0 - 0.3:
        for j, p in enumerate(CH[["F#m", "Bm", "E", "F#m"][i % 4]][1]):
            note(PIZ, p, s + j * BEAT, BEAT * 0.6, 52 + i * 3)
        s += BAR * 0.75
        i += 1

    # DROP: nothing from 15.4 to 16.1 s, then the page: a short rise
    for j, p in enumerate([57, 61, 64, 69, 73, 76, 81, 85]):
        note(STR, p, PAGE + j * (FOOD - 0.1 - PAGE) / 8, 0.4, 44 + j * 3)

    # "food": first hit, marimba runs up while the water pours
    chord(BRASS, [45, 57, 61, 64, 69], FOOD, 0.8, 92)
    chord(STR, [45, 57, 64, 69, 73], FOOD, EXPERTS - FOOD - 0.1, 60)
    note(TIMP, 45, FOOD, 0.4, 104)
    note(DRUMS, 49, FOOD, 1.2, 66)
    for j, p in enumerate([69, 73, 76, 81, 85, 88, 93]):
        note(MAR, p, FOOD + 0.3 + j * 0.13, 0.2, 64)

    # experts: thinking pizzicato
    s = EXPERTS
    while s < DRINKS - 0.2:
        for j, p in enumerate([54, 57, 61, 57]):
            note(PIZ, p, s + j * BEAT, BEAT * 0.6, 46)
        s += BAR

    # drinks: strings rise
    for j, p in enumerate([57, 59, 61, 62, 64, 66, 68]):
        note(STR, p, DRINKS + j * (TEA - DRINKS) / 7, 0.5, 46 + j * 5)
    r = TEA - 1.1
    while r < TEA:
        k = (r - (TEA - 1.1)) / 1.1
        note(TIMP, 45, r, 0.09, int(26 + 56 * k))
        r += 0.09

    # "tea": the biggest hit, held through the pause
    chord(BRASS, [45, 57, 61, 64, 69, 73], TEA, 1.2, 104)
    chord(STR, [45, 57, 61, 64, 69, 73, 76], TEA, THIRST - TEA - 0.1, 66)
    note(TIMP, 45, TEA, 0.5, 114)
    note(DRUMS, 49, TEA, 1.6, 86)
    note(DRUMS, 36, TEA, 0.3, 92)
    for j, p in enumerate([81, 85, 88, 93]):
        note(GLOCK, p, TEA + 0.35 + j * 0.2, 0.8, 62)

    # the bounce returns, lighter, to loop
    s = THIRST
    i = 0
    while s < END - 0.2:
        bounce(s, ["A", "D", "E", "A"][i % 4], soft=10, answer=i % 2 == 1)
        s += BAR
        i += 1
    # the last moment rises into the glass drop of frame 0
    for j, p in enumerate([69, 73, 76]):
        note(MAR, p, END - 0.5 + j * 0.13, 0.12, 50)

    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    last = 0
    for at, _, m in events:
        tr.append(m.copy(time=at - last))
        last = at
    mid.save(os.path.join(HERE, "h30-eight-glasses.mid"))


if __name__ == "__main__":
    main()
