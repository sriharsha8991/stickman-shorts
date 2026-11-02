#!/usr/bin/env python3
"""Score for V023 "Why is your sticky note's glue so weak?" (v023-failed-glue).

Storybook documentary bed, C major, 92 BPM, sparse under the voice (different from H05's A-major muted-guitar office):
lab (0–14.8 s): soft felt piano broken chords + pizzicato strings ticking like a careful experiment, a little
bassoon "oops" figure in the gap after "weak"; church (14.8–20.9 s): warm string pad + harp arpeggios and a soft
original celesta line in the gaps (no hymn tune is quoted); a ~0.6 s DROP (silence) right before cue 6 at 21.97 s;
the reveal: harp gliss + timpani hit, then a broad, warm string + piano swell that peaks on "sticky note" (25.07 s)
and a glockenspiel sparkle on "today"; the ending settles and the last bar repeats the opening piano so it loops.
Writes v023-failed-glue.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

BPM = 92
TPB = 480
SEC = TPB * BPM / 60
BEAT = 60 / BPM
BAR = 4 * BEAT
HERE = os.path.dirname(os.path.abspath(__file__))

PIANO, PIZZ, BSN, STR, HARP, CEL, GLOCK, TIMP, DRUMS = 0, 1, 2, 3, 4, 5, 6, 7, 9
PROGRAMS = {PIANO: 0, PIZZ: 45, BSN: 70, STR: 48, HARP: 46, CEL: 8, GLOCK: 9, TIMP: 47}

CHURCH = 14.8  # cue 4 "Years later"
REVEAL = 21.97  # cue 6 "Then he put the weak glue on them."
DROP = REVEAL - 0.6
PEAK = 25.07  # "sticky note"
TODAY = 26.1
KEEP = 27.73  # cue 8
END = 34.4

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
    "C": (36, [60, 64, 67]),
    "Am": (33, [57, 60, 64]),
    "F": (29, [57, 60, 65]),
    "G": (31, [59, 62, 67]),
    "Em": (28, [59, 64, 67]),
    "Dm": (26, [57, 62, 65]),
}


def lab_bar(s0, name, pizz=True):
    root, v = CH[name]
    note(PIANO, root + 12, s0, BAR * 0.95, 44)
    for k, p in enumerate([v[0], v[1], v[2], v[1]]):
        note(PIANO, p, s0 + k * BEAT, BEAT * 0.9, 34 + (k == 0) * 6)
    if pizz:
        for k in (1, 3):
            note(PIZZ, v[2] + 12, s0 + k * BEAT, BEAT * 0.3, 40)
        note(PIZZ, root + 24, s0 + 2 * BEAT + BEAT / 2, BEAT * 0.3, 34)


def church_bar(s0, name, k):
    root, v = CH[name]
    chord(STR, [p - 12 for p in v], s0, BAR * 0.98, 34 + 3 * k)
    note(STR, root + 12, s0, BAR * 0.98, 36)
    for i, p in enumerate([v[0], v[1], v[2], v[1] + 12, v[2], v[1]]):
        note(HARP, p, s0 + i * BAR / 6, BAR / 6 * 1.4, 36)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {PIANO: 96, PIZZ: 80, BSN: 82, STR: 84, HARP: 88, CEL: 78, GLOCK: 72, TIMP: 100, DRUMS: 70}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch, pan in {PIZZ: 40, HARP: 84, CEL: 76, BSN: 52}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=10, value=pan)))
    for ch in (PIANO, STR, HARP, CEL, GLOCK, PIZZ):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=70)))

    # lab: C Am F G | C Am F G ...
    prog = ["C", "Am", "F", "G"]
    s, i = 0.0, 0
    while s + BAR <= CHURCH + 0.05:
        lab_bar(s, prog[i % 4], pizz=i > 0)
        s += BAR
        i += 1
    # bassoon "oops" after "weak" (11.8 s, in the gap)
    for k, p in enumerate([55, 53, 50]):
        note(BSN, p, 11.9 + k * 0.22, 0.24 if k < 2 else 0.5, 52)
    # church: F C Dm G — strings + harp, celesta answers in the gaps
    k = 0
    s = CHURCH
    for name in ["F", "C", "Dm", "G"]:
        if s >= DROP:
            break
        church_bar(s, name, k)
        s += BAR
        k += 1
    for st, ps in [(18.15, [72, 74, 76]), (21.0, [79, 77])]:
        for j, p in enumerate(ps):
            note(CEL, p, st + j * BEAT / 2, BEAT / 2, 40)
    # DROP: silence before the reveal
    events[:] = [e for e in events if not (t(DROP) <= e[0] < t(REVEAL) and e[2].type == "note_on")]
    # REVEAL: harp gliss into a timpani hit, warm swell to the peak on "sticky note"
    for j, p in enumerate([60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79]):
        note(HARP, p, REVEAL - 0.02 + j * 0.035, 0.6, 46 + j)
    note(TIMP, 36, REVEAL, 1.2, 58)
    note(DRUMS, 49, REVEAL, 1.0, 40)
    chord(STR, [48, 55, 60, 64], REVEAL, PEAK - REVEAL, 44)
    chord(PIANO, [36, 48], REVEAL, 1.6, 54)
    # the peak: big C major with an added 9 — strings + piano + glock sparkle
    chord(STR, [48, 55, 60, 64, 67, 72], PEAK, KEEP - PEAK, 50)
    chord(PIANO, [36, 48, 60, 64, 67, 74], PEAK, 2.4, 50)
    note(TIMP, 36, PEAK, 0.8, 56)
    for j, p in enumerate([84, 88, 91, 96]):
        note(GLOCK, p, TODAY + j * 0.12, 0.5, 44)
    # ending: calm F → G → C, light pizz, then the opening piano bar so it loops into frame 0
    s = KEEP
    for name in ["F", "G"]:
        root, v = CH[name]
        chord(STR, [p - 12 for p in v], s, BAR * 0.95, 36)
        note(PIANO, root + 12, s, BAR * 0.9, 42)
        for kk in (1, 3):
            note(PIZZ, v[2] + 12, s + kk * BEAT, BEAT * 0.3, 36)
        s += BAR
    lab_bar(s, "C", pizz=False)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v023-failed-glue.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
