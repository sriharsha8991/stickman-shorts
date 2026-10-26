#!/usr/bin/env python3
"""Score for V016 "Estimated 2 days. Took 2 weeks." (v016-two-weeks). Original, ~29.6 s.

120 BPM, 4/4 -> 1 bar = 2 s. Energetic dev-room pulse: muted clavinet 8ths + synth bass + light kit.
  0-2.6 s   cold open: stab on the stamp (0.4 s), ticking pulse while the calendar flips
  2.6-5 s   open loop: pulse drops to hats only (space for "why?")
  5-8.8 s   number reveal: bass walk, string-tremolo RISER into the 56 hit (8.83 s) + brass stab + crash
  9.8-15 s  worst case / pie: half-time, minor (Em C), sparse
  15.9 s    THEY KNEW: brass stab + timpani; 15.9-19.4 s tension pad (B7)
  19.6-22 s LINK IT: lift to G major, glockenspiel run on "did" (21.7 s)
  22.3-27.3 s payoff: bright G D Em C pulse, quiet under the voice
  27.4-29.6 s loop: back to the opening pulse (Em) so the cut into frame 0 is seamless
Writes v016-two-weeks.mid next to this file. Render with tools/render_midi.py.
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

CLAV, BASS, PAD, TREM, BRASS, GLOCK, TIMP, DRUMS = 0, 1, 2, 3, 4, 5, 6, 9
PROGRAMS = {CLAV: 7, BASS: 38, PAD: 89, TREM: 44, BRASS: 61, GLOCK: 9, TIMP: 47}

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
    "Em": (40, [55, 59, 64]),
    "C": (36, [55, 60, 64]),
    "D": (38, [54, 57, 62]),
    "G": (43, [55, 59, 62]),
    "B7": (35, [54, 57, 63]),
    "Am": (45, [57, 60, 64]),
}


def pulse(t0, t1, name, vel=44, clav=True, bass=True):
    """Muted clavinet 8ths on the chord's top two notes + bass on beats 1 and 3."""
    root, v = CH[name]
    t = sec(t0)
    end = sec(t1)
    k = 0
    while t < end:
        if clav:
            chord(CLAV, v[1:], t, E16, vel - (6 if k % 2 else 0))
        if bass and k % 4 == 0:
            note(BASS, root, t, E8 + E16, vel + 10)
        t += E8
        k += 1


def hats(t0, t1, vel=34, kick=True):
    t = sec(t0)
    end = sec(t1)
    k = 0
    while t < end:
        note(DRUMS, 42, t, E16, vel + (8 if k % 2 == 0 else 0))
        if kick and k % 4 == 0:
            note(DRUMS, 36, t, E8, vel + 30)
        if kick and k % 4 == 2:
            note(DRUMS, 38, t, E8, vel + 10)
        t += E8
        k += 1


def stab(t, ps, vel=96):
    chord(BRASS, ps, sec(t), E8 + E16, vel)
    note(DRUMS, 49, sec(t), BEAT, vel)
    note(TIMP, 40, sec(t), BEAT, vel - 10)


def main():
    # cold open: stamp hit + calendar tick pulse
    stab(0.4, [52, 59, 64], 100)
    pulse(0.4, 2.6, "Em", 46)
    hats(0.4, 2.6, 30)
    # open loop: hats only, a question
    hats(2.6, 5.0, 26, kick=False)
    note(CLAV, 71, sec(2.6), E8, 50)
    note(CLAV, 74, sec(3.0), E8, 46)
    # number reveal 5.0-8.8: bass walk + riser
    pulse(5.0, 7.0, "C", 42)
    pulse(7.0, 8.83, "D", 44)
    hats(5.0, 8.83, 28)
    for k in range(14):  # rising tremolo strings into the hit
        note(TREM, 52 + k, sec(7.0) + k * (sec(1.83) // 14), sec(1.83) // 14 + E16, 40 + k * 4)
    for k in range(8):
        note(DRUMS, 38, sec(8.83) - (8 - k) * E16, E16, 40 + k * 8)
    stab(8.83, [52, 55, 59, 64], 110)
    # worst case / pie 9.8-15: half time, sparse minor
    chord(PAD, [52, 55, 59], sec(9.0), sec(3.0), 38)
    chord(PAD, [48, 52, 55], sec(12.0), sec(3.4), 36)
    for t in [9.0, 10.0, 11.0, 12.0, 13.0, 14.0]:
        note(BASS, 40 if t < 12 else 36, sec(t), E8, 50)
        note(DRUMS, 36, sec(t), E8, 52)
    note(DRUMS, 42, sec(11.87), E16, 50)  # "too fast" stamp
    chord(CLAV, [67, 71], sec(13.5), E16, 50)  # "one in three"
    # re-hook: THEY KNEW (15.9 s)
    for k in range(4):
        note(TIMP, 40, sec(15.2) + k * E16, E16, 44 + k * 10)
    stab(15.9, [47, 54, 57, 63], 108)
    chord(PAD, [47, 51, 54, 57], sec(16.2), sec(3.3), 40)
    hats(16.2, 19.5, 24, kick=False)
    note(DRUMS, 38, sec(18.83), E8, 70)  # the ✗
    # link it: lift to G major
    pulse(19.6, 21.6, "G", 42)
    hats(19.6, 22.2, 28)
    for k, p in enumerate([79, 83, 86, 91]):
        note(GLOCK, p, sec(21.67) + k * E16, BEAT, 70)
    note(DRUMS, 49, sec(21.67), BEAT, 80)
    # payoff 22.3-27.3: quiet bright pulse G D Em C
    for i, name in enumerate(["G", "D", "Em", "C"]):
        pulse(22.3 + i * 1.25, 23.55 + i * 1.25, name, 38)
    hats(22.3, 27.3, 22)
    note(GLOCK, 83, sec(26.8), BEAT, 58)
    # loop: opening pulse again
    pulse(27.4, 29.6, "Em", 44)
    hats(27.4, 29.6, 30)

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
    out = os.path.join(HERE, "v016-two-weeks.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
