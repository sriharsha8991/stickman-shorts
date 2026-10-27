#!/usr/bin/env python3
"""Score for V017 "Why ₹2,999 crossed out makes ₹999 feel cheap" (v017-crossed-price). Original, ~28.2 s.

115 BPM, harbour at sunset. Tension in D minor (pizzicato + low cello drone + accordion breaths), bright
D-major release on the reality. Sparse under the voice.
  0-0.5 s   cold open: beam charge (harp gliss up) -> hit on the blast (0.47 s)
  1-6.3 s   pizz ostinato Dm, chain clank on "decides" (4.3 s), low thud on "pay" (5.47 s)
  6.4-9.6 s wheel: ticking marimba spin, bell on 10 (8.0) and 65 (8.63)
  9.6-12.6  question: held cello + accordion, no pulse
  12.6-16.9 gauges: pizz returns, riser into the 45 slam (16.87 s re-hook)
  18-20     "dragged": low drone + bell on the aha (19.0)
  20.2-25   tag again: Bb-A tension, then D MAJOR release on "old price" snap (24.17)
  26-28.2   loop: back to the opening Dm pizz so the cut into frame 0 is seamless
Writes v017-crossed-price.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

TPB = 480
BPM = 115
BEAT = TPB
BAR = TPB * 4
E8 = TPB // 2
E16 = TPB // 4
HERE = os.path.dirname(os.path.abspath(__file__))

PIZZ, CELLO, ACC, HARP, MAR, BELL, TIMP, DRUMS = 0, 1, 2, 3, 4, 5, 6, 9
PROGRAMS = {PIZZ: 45, CELLO: 42, ACC: 21, HARP: 46, MAR: 12, BELL: 14, TIMP: 47}

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
    "Dm": (38, [57, 62, 65]),
    "Bb": (34, [58, 62, 65]),
    "A": (33, [57, 61, 64]),
    "Gm": (31, [55, 58, 62]),
    "D": (38, [57, 62, 66]),
    "G": (31, [55, 59, 62]),
}


def pizz(t0, t1, name, vel=44):
    root, v = CH[name]
    t, end, k = sec(t0), sec(t1), 0
    pat = [v[0], v[1], v[2], v[1]]
    while t < end:
        note(PIZZ, pat[k % 4], t, E8, vel - (8 if k % 2 else 0))
        if k % 4 == 0:
            note(PIZZ, root + 12, t, E8, vel + 4)
        t += E8
        k += 1


def drone(t0, t1, name, vel=34):
    root, v = CH[name]
    note(CELLO, root + 12, sec(t0), sec(t1 - t0), vel)


def hit(t, vel=100):
    note(DRUMS, 49, sec(t), BEAT, vel)
    note(TIMP, 38, sec(t), BEAT, vel - 10)
    note(CELLO, 38, sec(t), BEAT, vel - 20)


def main():
    # cold open: harp gliss up into the blast
    for k, p in enumerate([50, 53, 57, 62, 65, 69, 74]):
        note(HARP, p, k * (sec(0.4) // 7), BEAT, 50 + k * 5)
    hit(0.47, 104)
    pizz(1.0, 6.3, "Dm", 42)
    drone(1.0, 4.2, "Dm", 30)
    drone(4.2, 6.3, "Bb", 32)
    note(DRUMS, 56, sec(4.27), E8, 60)  # chain clank
    note(TIMP, 38, sec(5.47), BEAT, 82)  # "pay" thud
    note(DRUMS, 36, sec(5.47), E8, 70)
    # wheel 6.4-9.6: marimba spinning ticks slowing
    t = 6.9
    gap = 0.08
    while t < 8.0:
        note(MAR, 74 + int((t * 10) % 5), sec(t), E16, 46)
        t += gap
        gap *= 1.12
    note(BELL, 74, sec(8.0), BEAT * 2, 70)
    for k in range(5):
        note(MAR, 76 - k, sec(8.25) + k * E16, E16, 44)
    note(BELL, 81, sec(8.63), BEAT * 2, 74)
    # question 9.6-12.6: held, no pulse
    chord(ACC, [57, 62, 65], sec(9.7), sec(2.8), 36)
    drone(9.7, 12.5, "Gm", 32)
    note(HARP, 69, sec(11.67), BEAT, 50)
    note(HARP, 72, sec(11.9), BEAT, 46)
    # gauges 12.6-16.9
    pizz(12.6, 15.5, "Dm", 40)
    note(MAR, 81, sec(14.1), E8, 60)  # 25%
    for k in range(12):  # riser into 45
        note(ACC, 50 + k, sec(15.5) + k * (sec(1.37) // 12), sec(1.37) // 12 + E16, 34 + k * 5)
    for k in range(6):
        note(DRUMS, 38, sec(16.87) - (6 - k) * E16, E16, 40 + k * 9)
    hit(16.87, 110)
    chord(ACC, [57, 61, 64], sec(16.9), sec(1.0), 40)
    # dragged 18-20
    drone(18.0, 20.1, "Dm", 36)
    note(DRUMS, 56, sec(18.0), E8, 50)
    note(BELL, 86, sec(19.0), BEAT * 2, 70)
    note(HARP, 74, sec(19.1), BEAT, 52)
    # tag again 20.2-24.1: Bb -> A tension
    pizz(20.2, 22.2, "Bb", 38)
    pizz(22.2, 24.1, "A", 40)
    note(DRUMS, 38, sec(22.83), E8, 72)  # STEAL stamp
    # release: D major on the snap
    hit(24.17, 96)
    for k, p in enumerate([62, 66, 69, 74, 78]):
        note(HARP, p, sec(24.17) + k * E16, BEAT, 64)
    chord(ACC, [62, 66, 69], sec(24.2), sec(1.7), 40)
    drone(24.2, 25.9, "D", 34)
    note(BELL, 78, sec(25.13), BEAT, 56)
    # loop
    pizz(26.0, 28.2, "Dm", 42)
    drone(26.0, 28.2, "Dm", 30)

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
    out = os.path.join(HERE, "v017-crossed-price.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
