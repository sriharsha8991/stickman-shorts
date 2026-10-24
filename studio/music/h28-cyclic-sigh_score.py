#!/usr/bin/env python3
"""Score for H28 "5 minutes of cyclic sighing" (h28-cyclic-sigh).

Calm morning, 84 BPM (bar = 2.857 s), 10 bars = 28.6 s, F major (Fmaj7 / Am7 / Bbmaj7 / C). Soft e-piano, a warm
pad that "breathes" (expression swells in, long fade out each bar), light shaker in the study bars, wind chimes on
the meter fill and the "more" reveal. Different instruments, key and tempo from V015's storybook strings.
  1.13 s meter overload hit · 4.5 s double-sigh chimes · bars 3-4 shaker (study) · 15.2 s "more" bloom
  bar 7 caveat thins out · bar 8 "try five minutes" · bar 9 loops to bar 0
"""
import os
import mido

TPB = 480
BPM = 84
BAR = TPB * 4
SEC_PER_BAR = 4 * 60 / BPM
HERE = os.path.dirname(os.path.abspath(__file__))
EP, PAD, BASS, CHIME, DRUMS = 0, 1, 2, 3, 9
PROGRAMS = {EP: 4, PAD: 89, BASS: 32, CHIME: 14}
events = []


def note(ch, p, s, d, v):
    events.append((int(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((int(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def cc(ch, c, val, t=0):
    events.append((t, 0, mido.Message("control_change", channel=ch, control=c, value=val)))


def bar(b):
    return int(b * BAR)


def sec(t):
    return int(t / SEC_PER_BAR * BAR)


E8, E16 = TPB // 2, TPB // 4
CH = {
    "Fmaj7": (29, [57, 60, 64, 65]),
    "Am7": (33, [55, 60, 64, 57]),
    "Bbmaj7": (34, [57, 62, 65, 58]),
    "C": (36, [55, 60, 64]),
    "Dm7": (38, [57, 60, 65, 62]),
    "Gm7": (31, [58, 62, 65]),
}


def pad(b, n, v=36, swell=True):
    root, vo = CH[n]
    for p in vo[:3]:
        note(PAD, p - 12, bar(b), BAR, v)
    note(BASS, root, bar(b), BAR - E8, 42)
    if swell:  # the pad "breathes": in over 1.5 beats, long out
        for k in range(16):
            x = k / 15
            val = int(70 + 50 * (x / 0.35 if x < 0.35 else (1 - x) / 0.65))
            cc(PAD, 11, max(40, min(127, val)), bar(b) + int(x * BAR))


def ep(b, n, v=40, notes=(0, 1, 2)):
    _, vo = CH[n]
    for k, i in enumerate(notes):
        note(EP, vo[i] + 12, bar(b) + k * TPB + (TPB if k else 0), TPB * 2, v - k * 4)


def shaker(b, v=26):
    for k in range(8):
        note(DRUMS, 82, bar(b) + k * E8, E16, v + (8 if k % 2 == 0 else 0))


def hit(t, v=88):
    note(DRUMS, 49, sec(t), TPB * 2, v)
    note(DRUMS, 36, sec(t), E8, v - 10)
    note(BASS, 29, sec(t), TPB * 2, 70)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {EP: 90, PAD: 80, BASS: 84, CHIME: 70, DRUMS: 76}.items():
        cc(ch, 7, vol)
    for ch, pan in {CHIME: 84, EP: 54}.items():
        cc(ch, 10, pan)
    for ch in (EP, PAD, CHIME):
        cc(ch, 91, 80)

    # meter fill: rising chimes into the overload at 1.13 s
    for k in range(6):
        note(CHIME, [65, 69, 72, 76, 77, 81][k], sec(0.1) + k * E16 * 2, E8, 40 + k * 8)
    hit(1.13)
    pad(0, "Fmaj7", 34); ep(0, "Fmaj7", 38)
    pad(1, "Am7", 32)  # double sigh (4.5 s): two soft chime breaths
    note(CHIME, 72, sec(4.53), E8, 50); note(CHIME, 77, sec(4.83), E8, 54)
    pad(2, "Bbmaj7", 34); ep(2, "Bbmaj7", 36)  # long breath out 7.3 s
    pad(3, "C", 34); shaker(3, 22)  # study: month, 108 people
    pad(4, "Dm7", 32); shaker(4, 24)  # mindfulness "a little"
    # 15.2 s re-hook "more": soft swell + bloom
    pad(5, "Fmaj7", 44); ep(5, "Fmaj7", 44, (0, 1, 2))
    note(DRUMS, 49, sec(15.2), TPB * 2, 70)
    for k, p in enumerate([72, 76, 79, 84]):
        note(CHIME, p, sec(15.2) + k * E16, TPB, 70)
    pad(6, "Bbmaj7", 36, True)  # breathe in / sip / long out
    pad(7, "Gm7", 30)  # caveat - shaker out, quieter
    pad(8, "C", 36); ep(8, "C", 40); shaker(8, 24)  # try five minutes
    for k, p in enumerate([72, 76, 79, 81]):
        note(CHIME, p, sec(25.2) + k * E16, TPB, 64)
    pad(9, "Fmaj7", 32); ep(9, "Fmaj7", 34)  # loops into bar 0

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "h28-cyclic-sigh.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
