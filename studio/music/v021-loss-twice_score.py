#!/usr/bin/env python3
"""Score for V021 "Lose ₹500. Win ₹500. Not equal." (v021-loss-twice), 27 s.

112 BPM, Bb major, a small vaudeville "weigh house" band: tuba oom-pah, brushes, clarinet stabs in the gaps,
celesta "coin ting" motif, pizzicato strings for the twist. Sparse under the voice (a bed, not a melody).
Hits are placed on the storyboard's spoken words (seconds from voice.ts):
  0.0  scale slam (frame 0)            -> tuba + clarinet stab + soft crash
  0-7.1  weigh house                   -> oom-pah (tuba on 1/3, brush on 2/4), stab on "twice" (4.7 s)
  7.1-13.5 coin game show              -> walking bass 8ths + hats, coin ting on the landing (8.7 s),
                                          riser 12.0-13.2, half-second drop, HIT on "double" (13.5 s)
  13.5-16.4 "a thousand, feel even"    -> warm Bb pad resolve
  16.4-23.7 twist "but… won't feel it" -> Gm Eb Cm F, pizzicato + low tuba, quiet
  23.7  calculator levels the scale    -> resolve hit + celesta flourish
  23.7-27 back to the oom-pah of frame 0 (loop-friendly)
Writes v021-loss-twice.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

TPB = 480
BPM = 112
HERE = os.path.dirname(os.path.abspath(__file__))

TUBA, CLAR, CELESTA, BASS, STR, PAD, PIZZ, DRUMS = 0, 1, 2, 3, 4, 5, 6, 9
PROGRAMS = {TUBA: 58, CLAR: 71, CELESTA: 8, BASS: 32, STR: 48, PAD: 89, PIZZ: 45}

events = []


def T(sec):
    return int(round(sec * TPB * BPM / 60))


BEAT = TPB
E8 = TPB // 2


def note(ch, pitch, start, dur, vel):
    events.append((start, 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((start + dur, 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def chord(ch, ps, start, dur, vel):
    for p in ps:
        note(ch, p, start, dur, vel)


def cc(ch, control, value, tick):
    events.append((tick, 0, mido.Message("control_change", channel=ch, control=control, value=value)))


CH = {
    "Bb": (34, [58, 62, 65]),
    "F": (29, [57, 60, 65]),
    "Eb": (39, [55, 58, 63]),
    "Gm": (31, [55, 58, 62]),
    "Cm": (36, [55, 60, 63]),
}


def oompah(t0, t1, prog=("Bb", "F")):
    """Tuba on beats 1/3 (root/fifth), soft brush on 2/4."""
    t = T(t0)
    end = T(t1)
    k = 0
    while t < end:
        name = prog[(k // 4) % len(prog)]
        root, v = CH[name]
        beat = k % 4
        if beat in (0, 2):
            note(TUBA, root + (0 if beat == 0 else 7) + 12, t, E8 + 60, 74)
        else:
            note(DRUMS, 40, t, E8, 34)  # soft brush-ish snare
            chord(PIZZ, [p - 12 for p in v], t, E8 // 2, 30)
        t += BEAT
        k += 1


def walking(t0, t1):
    names = ["Bb", "Gm", "Eb", "F"]
    t = T(t0)
    end = T(t1)
    k = 0
    while t < end:
        root, v = CH[names[(k // 8) % 4]]
        note(BASS, root + 12 + (0, 4, 7, 9, 12, 9, 7, 4)[k % 8] - (1 if (k % 8) == 1 and names[(k // 8) % 4] in ("Gm", "Cm") else 0), t, E8 - 20, 66 if k % 2 == 0 else 52)
        note(DRUMS, 42, t, E8 // 2, 40 if k % 2 else 52)
        if k % 4 == 2:
            note(DRUMS, 38, t, E8, 44)
        t += E8
        k += 1


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {TUBA: 96, CLAR: 84, CELESTA: 80, BASS: 98, STR: 80, PAD: 70, PIZZ: 88, DRUMS: 86}.items():
        cc(ch, 7, vol, 0)
    for ch, pan in {CLAR: 44, CELESTA: 84, PIZZ: 70, STR: 56}.items():
        cc(ch, 10, pan, 0)
    for ch in (CLAR, CELESTA, STR, PAD, PIZZ):
        cc(ch, 91, 64, 0)

    # 0.0: the slam
    note(DRUMS, 49, 0, BEAT, 70)
    note(DRUMS, 36, 0, E8, 96)
    note(TUBA, 34, 0, BEAT, 100)
    chord(CLAR, [70], 0, E8, 82)
    oompah(0.55, 7.0)
    # "twice" 4.7 s: clarinet double stab
    note(CLAR, 77, T(4.73), E8 // 2, 80)
    note(CLAR, 77, T(4.73) + E8, E8 // 2, 72)
    note(DRUMS, 36, T(4.73), E8, 80)

    # 7.1-13.2 game show
    note(DRUMS, 49, T(7.13), BEAT, 64)
    walking(7.13, 13.15)
    # coin ting on the landing
    for k, p in enumerate([82, 89, 94]):
        note(CELESTA, p, T(8.67) + k * (E8 // 2), E8, 86 - k * 8)
    # riser: strings crescendo 12.0 -> 13.2
    for k in range(5):
        note(STR, 58 + k * 2, T(12.0) + k * (T(1.15) // 5), T(1.15) // 5, 50 + k * 9)
    # (drop 13.2-13.5) then HIT on "double"
    note(DRUMS, 49, T(13.5), BEAT * 2, 104)
    note(DRUMS, 36, T(13.5), E8, 112)
    note(TUBA, 34, T(13.5), BEAT * 2, 110)
    chord(CLAR, [70, 74, 77], T(13.5), BEAT, 92)
    chord(STR, [58, 62, 65, 70], T(13.5), BEAT * 2, 80)

    # 13.5-16.4 warm resolve
    chord(PAD, [46, 50, 53, 58], T(13.6), T(2.8), 52)
    note(CELESTA, 82, T(15.53), BEAT, 70)  # "even"

    # 16.4-23.7 twist: Gm Eb Cm F, pizzicato + low tuba, quiet
    seq = ["Gm", "Eb", "Cm", "F"]
    span = (23.6 - 16.45) / 4
    for i, name in enumerate(seq):
        root, v = CH[name]
        s = T(16.45 + i * span)
        note(TUBA, root + 12, s, T(span) - 40, 64)
        chord(PAD, [p - 12 for p in v], s, T(span), 36)
        n = int(span / (60 / BPM))
        for k in range(n):
            note(PIZZ, v[k % 3], s + k * BEAT, E8, 50)
    note(DRUMS, 38, T(18.1), E8, 60)  # "wins" stamp support

    # 23.7 calculator levels the scale: resolve + celesta flourish
    note(DRUMS, 49, T(23.73), BEAT * 2, 86)
    note(DRUMS, 36, T(23.73), E8, 100)
    note(TUBA, 34, T(23.73), BEAT * 2, 100)
    chord(STR, [58, 62, 65], T(23.73), BEAT * 2, 66)
    for k, p in enumerate([70, 74, 77, 82]):
        note(CELESTA, p, T(23.73) + k * (E8 // 2), E8, 78)
    oompah(24.4, 27.0)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v021-loss-twice.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
