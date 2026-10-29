#!/usr/bin/env python3
"""Score for V104 "You'd pay more for your wobbly shelf." (v104-wobbly-shelf), 27.2 s.

92 BPM, E major, a Sunday-workshop "DIY" band: nylon-guitar plucks, glockenspiel ting, woodblock hammer taps,
soft upright bass, warm pad. Sparse under the voice (a bed, not a melody). Hits on spoken words (s from voice.ts):
  0.0  frame 0 (hug)                  -> soft glock + guitar strum, then E–A–E–B pluck pattern
  6.8-7.4 "half built it"            -> woodblock hammer taps
  8.9-9.8 riser, drop, HIT on "sixty-three" (9.9 s)
  10-14.3 bass walks, guitar           (experiment)
  14.4-19.0 "but here's the catch"   -> drop to pad, C#m–A, pizz; low thud on "half" (18.5 s)
  19.7 "finish"                       -> resolve hit + glock flourish
  19.7-27.2 back to the pluck pattern of frame 0 (loop-friendly)
"""
import os

import mido

TPB = 480
BPM = 92
HERE = os.path.dirname(os.path.abspath(__file__))
GTR, GLOCK, BASS, PAD, PIZZ, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {GTR: 24, GLOCK: 9, BASS: 32, PAD: 89, PIZZ: 45}
events = []


def T(sec):
    return int(round(sec * TPB * BPM / 60))


BEAT = TPB
E8 = TPB // 2


def note(ch, p, start, dur, vel):
    events.append((start, 1, mido.Message("note_on", channel=ch, note=p, velocity=vel)))
    events.append((start + dur, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, start, dur, vel):
    for p in ps:
        note(ch, p, start, dur, vel)


def cc(ch, c, v, t=0):
    events.append((t, 0, mido.Message("control_change", channel=ch, control=c, value=v)))


CH = {"E": (40, [52, 56, 59, 64]), "A": (45, [52, 57, 61, 64]), "B": (47, [54, 59, 63, 66]),
      "C#m": (49, [52, 56, 61, 64]), "F#m": (42, [54, 57, 61, 66])}


def pluck(t0, t1, prog=("E", "A", "E", "B"), vel=46):
    t, end, k = T(t0), T(t1), 0
    while t < end:
        root, v = CH[prog[(k // 8) % len(prog)]]
        if k % 8 == 0:
            note(BASS, root, t, BEAT + E8, 62)
        if k % 8 == 4:
            note(BASS, root + 7, t, BEAT, 52)
        pat = (0, 2, 1, 3, 0, 2, 1, 2)[k % 8]
        note(GTR, v[pat], t, E8 + 80, vel + (8 if k % 8 == 0 else 0))
        t += E8
        k += 1


def main():
    for ch, p in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=p)))
    for ch, v in {GTR: 92, GLOCK: 78, BASS: 96, PAD: 70, PIZZ: 80, DRUMS: 84}.items():
        cc(ch, 7, v)
    for ch, pan in {GTR: 52, GLOCK: 86, PIZZ: 68}.items():
        cc(ch, 10, pan)
    for ch in (GTR, GLOCK, PAD, PIZZ):
        cc(ch, 91, 60)

    # frame 0
    chord(GTR, [40, 47, 52, 56, 59, 64], 0, BEAT * 2, 70)
    note(GLOCK, 76, 0, BEAT, 70)
    note(DRUMS, 36, 0, E8, 70)
    pluck(0.65, 6.7)
    # hammer taps
    for s in (6.77, 7.0, 7.23):
        note(DRUMS, 76, T(s), E8, 90)
    note(DRUMS, 77, T(7.5), E8, 80)
    pluck(7.6, 8.9, ("A",), 40)
    # riser + drop + hit on "sixty-three"
    for k in range(6):
        note(GLOCK, 64 + k * 2, T(8.9) + k * (T(0.8) // 6), T(0.8) // 6, 40 + k * 8)
    note(DRUMS, 49, T(9.9), BEAT * 2, 96)
    note(DRUMS, 36, T(9.9), E8, 108)
    note(BASS, 40, T(9.9), BEAT * 2, 100)
    chord(GTR, [52, 56, 59, 64, 68], T(9.9), BEAT * 2, 80)
    chord(GLOCK, [76, 80, 83], T(9.9), BEAT, 82)
    pluck(10.8, 14.2, ("A", "B"), 42)
    note(GLOCK, 83, T(12.33), E8, 60)  # "effort"
    # the catch: drop to pad + pizz
    seq = ["C#m", "A", "C#m", "F#m"]
    span = (19.0 - 14.4) / 4
    for i, n in enumerate(seq):
        root, v = CH[n]
        s = T(14.4 + i * span)
        chord(PAD, [p - 12 for p in v[:3]], s, T(span), 40)
        note(BASS, root, s, T(span) - 40, 56)
        for k in range(int(span / (60 / BPM))):
            note(PIZZ, v[k % 3], s + k * BEAT, E8, 46)
    note(DRUMS, 41, T(17.3), E8, 70)  # coins crash
    note(DRUMS, 36, T(18.53), E8, 96)  # "half"
    note(BASS, 37, T(18.53), BEAT, 90)
    # finish: resolve
    note(DRUMS, 49, T(19.67), BEAT * 2, 84)
    note(DRUMS, 36, T(19.67), E8, 100)
    note(BASS, 40, T(19.67), BEAT * 2, 96)
    chord(PAD, [52, 56, 59, 64], T(19.67), T(2.5), 50)
    for k, p in enumerate([76, 80, 83, 88]):
        note(GLOCK, p, T(19.67) + k * (E8 // 2), E8, 76)
    pluck(20.5, 27.2, ("E", "A", "E", "B"), 44)
    note(DRUMS, 76, T(24.1), E8, 70)  # "would" stamp
    note(GLOCK, 76, T(26.0), BEAT, 60)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v104-wobbly-shelf.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
