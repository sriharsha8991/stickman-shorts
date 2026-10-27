#!/usr/bin/env python3
"""Score for H15 "The Monday effect is real (fresh starts)" (h15-fresh-start). Original, ~25.7 s.

120 BPM, bright synth-pop rising pulse in A major (vs V017's D-minor pizzicato harbour): synth bass 8ths,
saw pad, clap backbeat, square-lead blips only in gaps. Big hit on the door blast (0.4 s) and on +47 % (14.2 s).
  0-4.2 s   door blast (0.4 s) + four-on-floor, bell on +33 % (2.93 s)
  4.2-7 s   open loop: kick drops out, filtered pad + question blip
  7-10 s    swipe counter: 16th hat ticks + bass
  10-13 s   bars: bell notes on +14 / +12, riser into the semester hit (14.2 s)
  15.6-17.8 clean slate: sweep + happy chord
  17.9-20.8 the catch: F#m dip, bass falls
  20.8-23.6 payoff: lift back to A major, lead blip on "dip" (23.07 s)
  23.6-25.7 loop: build into the door again
Writes h15-fresh-start.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

TPB = 480
BPM = 120
BEAT = TPB
BAR = TPB * 4
E8 = TPB // 2
E16 = TPB // 4
HERE = os.path.dirname(os.path.abspath(__file__))

BASS, PAD, LEAD, BELL, DRUMS = 0, 1, 2, 3, 9
PROGRAMS = {BASS: 38, PAD: 90, LEAD: 80, BELL: 10}

events = []


def sec(s):
    return int(round(s * BPM / 60 * TPB))


def note(ch, pitch, start, dur, vel):
    events.append((start, 1, mido.Message("note_on", channel=ch, note=pitch, velocity=max(1, min(127, vel)))))
    events.append((start + dur, 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def chord(ch, ps, start, dur, vel):
    for p in ps:
        note(ch, p, start, dur, vel)



CH = {
    "A": (33, [57, 61, 64]),
    "E": (28, [56, 59, 64]),
    "F#m": (30, [57, 61, 66]),
    "D": (26, [57, 62, 66]),
}


def groove(t0, t1, name, vel=44, kick=True, clap=True, bass=True):
    root, v = CH[name]
    t, end, k = sec(t0), sec(t1), 0
    while t < end:
        if bass:
            note(BASS, root + (12 if k % 2 else 0), t, E16 + E16 // 2, vel + 6)
        note(DRUMS, 42, t, E16, vel - 12 + (6 if k % 2 else 0))
        if kick and k % 2 == 0:
            note(DRUMS, 36, t, E8, vel + 24)
        if clap and k % 4 == 2:
            note(DRUMS, 39, t, E8, vel + 6)
        t += E8
        k += 1


def pad(t0, t1, name, vel=34):
    chord(PAD, CH[name][1], sec(t0), sec(t1 - t0), vel)


def hit(t, vel=104):
    note(DRUMS, 49, sec(t), BEAT * 2, vel)
    note(DRUMS, 36, sec(t), E8, vel)
    chord(LEAD, [69, 73, 76], sec(t), E8, vel - 30)


def main():
    for k in range(6):
        note(DRUMS, 38, k * (sec(0.4) // 6), E16, 40 + k * 10)
    hit(0.4)
    groove(0.4, 4.23, "A", 44)
    pad(0.4, 4.23, "A")
    note(BELL, 81, sec(2.93), BEAT, 70)  # +33%
    # open loop
    pad(4.23, 7.03, "E", 32)
    groove(4.23, 7.03, "E", 34, kick=False, clap=False)
    note(LEAD, 76, sec(6.43), E8, 50)
    note(LEAD, 80, sec(6.68), E8, 54)
    # counter
    t = sec(7.03)
    while t < sec(9.93):
        note(DRUMS, 42, t, E16 // 2, 34)
        t += E16
    groove(7.03, 9.93, "D", 38, kick=True, clap=False)
    note(BELL, 88, sec(9.40), BEAT, 66)
    # bars
    groove(10.13, 13.13, "A", 40)
    pad(10.13, 13.13, "D", 30)
    note(BELL, 76, sec(11.06), BEAT, 64)
    note(BELL, 74, sec(12.60), BEAT, 62)
    for k in range(12):
        note(PAD, 57 + k, sec(13.13) + k * (sec(1.03) // 12), sec(1.03) // 12 + E16, 34 + k * 5)
    for k in range(8):
        note(DRUMS, 38, sec(14.16) - (8 - k) * E16, E16, 40 + k * 9)
    hit(14.16, 112)
    groove(14.23, 15.63, "A", 46)
    # clean slate
    pad(15.63, 17.83, "D", 34)
    groove(15.63, 17.83, "D", 36, kick=False)
    chord(BELL, [73, 76, 81], sec(17.33), BEAT, 62)
    # the catch: dip
    pad(17.93, 20.83, "F#m", 34)
    for i, t in enumerate([17.93, 18.63, 19.33, 20.03]):
        note(BASS, 42 - i * 2, sec(t), E8 + E16, 52)
    note(DRUMS, 36, sec(20.20), E8, 64)  # "last"
    # payoff
    groove(20.83, 23.63, "A", 40)
    pad(20.83, 23.63, "E", 30)
    note(LEAD, 81, sec(23.06), E8, 60)
    note(BELL, 85, sec(23.06), BEAT, 60)
    # loop build
    groove(23.63, 25.73, "A", 42)
    for k in range(8):
        note(DRUMS, 38, sec(25.03) + k * (sec(0.7) // 8), E16, 34 + k * 6)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    for ch, prog in PROGRAMS.items():
        tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "h15-fresh-start.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
