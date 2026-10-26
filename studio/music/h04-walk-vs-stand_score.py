#!/usr/bin/env python3
"""Score for H04 "Walk vs stand after lunch" (h04-walk-vs-stand). Original, ~29.2 s. Fight-night bed.

120 BPM, 4/4 -> 1 bar = 2 s. Energetic dev-room pulse: muted clavinet 8ths + synth bass + light kit.
  0.33 s clash stab · 5.4/8.1 s round bells · 9.3 s WALK hit · 13.7 s aha · 19.8 s quarter · 20.4 s fine print (drums out) · 23.9 s bright payoff · 27.2 s fight loop
Writes h04-walk-vs-stand.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

TPB = 480
BPM = 130
BEAT = TPB
BAR = TPB * 4
E8 = TPB // 2
E16 = TPB // 4
HERE = os.path.dirname(os.path.abspath(__file__))

CLAV, BASS, PAD, TREM, BRASS, GLOCK, TIMP, DRUMS = 0, 1, 2, 3, 4, 14, 6, 9  # GLOCK slot = tubular bell
PROGRAMS = {CLAV: 62, BASS: 36, PAD: 50, TREM: 44, BRASS: 61, GLOCK: 14, TIMP: 47}

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
    "Dm": (38, [57, 62, 65]),
    "F": (41, [57, 60, 65]),
    "Bb": (46, [58, 62, 65]),
    "A": (45, [57, 61, 64]),
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


def toms(t, n=4, vel=70):
    for k in range(n):
        note(DRUMS, [50, 48, 45, 43][k % 4], sec(t) - (n - k) * E16, E16, vel + k * 6)


def bell(t, vel=90):
    note(GLOCK, 72, sec(t), 2 * BEAT, vel)
    note(GLOCK, 72, sec(t) + E8, 2 * BEAT, vel - 20)


def main():
    stab(0.33, [50, 57, 62, 65], 110)
    pulse(0.33, 2.3, "Dm", 46)
    hats(0.33, 2.3, 34)
    note(DRUMS, 57, sec(1.7), BEAT, 70)  # "Stop." cymbal choke
    # walk wins teaser
    pulse(2.3, 4.83, "Bb", 40, clav=False)
    hats(2.3, 4.83, 24, kick=False)
    toms(4.83)
    stab(4.83, [53, 57, 60, 65], 100)
    # round 1
    bell(5.4)
    pulse(5.6, 8.0, "Dm", 38)
    hats(5.6, 8.0, 26)
    note(DRUMS, 39, sec(7.57), E8, 60)  # "a little" clap
    # round 2
    bell(8.13)
    pulse(8.3, 9.27, "A", 44)
    toms(9.27, 4, 76)
    stab(9.27, [52, 57, 61, 64], 112)
    stab(10.07, [53, 57, 62, 65], 104)
    pulse(10.1, 11.2, "Dm", 44)
    hats(8.3, 11.2, 32)
    # why: sparse, then aha
    chord(PAD, [50, 53, 57], sec(11.2), sec(2.4), 36)
    note(BASS, 38, sec(11.2), BEAT, 44)
    for k, p in enumerate([74, 77, 81]):
        note(TREM, p, sec(13.2) + k * E16, E8, 50)
    stab(13.73, [53, 57, 60, 65], 92)
    # lab study: steady clock pulse
    pulse(14.2, 19.77, "F", 34, bass=True)
    for t in [15.5, 16.1, 16.8]:
        note(DRUMS, 76, sec(t), E16, 60)  # woodblock ticks
    for k in range(10):
        note(TREM, 57 + k, sec(18.3) + k * (sec(1.4) // 10), sec(1.4) // 10 + E16, 36 + k * 4)
    stab(19.77, [53, 57, 60, 65, 69], 100)
    # fine print: drums out
    chord(PAD, [50, 53, 57], sec(20.4), sec(3.4), 34)
    note(BASS, 38, sec(20.4), sec(3.4), 40)
    # payoff: bright F Bb C-ish (use F Bb F A)
    for i, name in enumerate(["F", "Bb", "F", "A"]):
        pulse(23.9 + i * 0.83, 24.73 + i * 0.83, name, 38)
    hats(23.9, 27.2, 26)
    bell(26.43, 70)
    # loop: fight pulse
    stab(27.56, [50, 57, 62, 65], 100)
    pulse(27.2, 29.2, "Dm", 46)
    hats(27.2, 29.2, 34)

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
    out = os.path.join(HERE, "h04-walk-vs-stand.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
