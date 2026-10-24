#!/usr/bin/env python3
"""Score for V015 "The Like button's builder regrets it" (v015-like-regret).

Storybook documentary, 95 BPM (bar = 2.526 s), 12 bars = 30.3 s, B minor / D major. Piano + strings, music-box
celesta, pizzicato; sparse under the voice (differs from H28's calm e-piano/pad bed).
  0.27 s dash hit (timpani + cymbal) · 3.9 s padlock clank · bar 2 piano drops out ("why")
  bars 3-4 2007 story, celesta flourish on AWESOME (9.7 s) · bar 5 positivity pizz
  bar 6 irregular celesta pings ("unpredictably") · 18.6 s quote re-hook: timpani roll + hit
  bar 8 pizz stabs on BLOCKED/QUIT/LOCKED · bars 9-10 warm lift (ask first) · bar 11 Bm loops
"""
import os
import mido

TPB = 480
BPM = 95
BAR = TPB * 4
SEC_PER_BAR = 4 * 60 / BPM
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, STR, BASS, CEL, PIZZ, TIMP, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {PIANO: 0, STR: 48, BASS: 43, CEL: 8, PIZZ: 45, TIMP: 47}
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
    "D": (38, [62, 66, 69]),
    "Bm": (35, [62, 66, 71]),
    "G": (31, [62, 67, 71]),
    "A": (33, [61, 64, 69]),
    "Em": (40, [59, 64, 67]),
    "F#m": (42, [61, 66, 69]),
    "Gmaj7": (31, [62, 66, 71]),
}


def strings(b, n, v=40, length=1.0):
    root, vo = CH[n]
    for p in vo:
        note(STR, p - 12, bar(b), int(BAR * length), v)
    note(BASS, root, bar(b), int(BAR * length) - E8, 46)


def piano(b, n, v=46, pattern=(0, 2, 1, 2)):
    root, vo = CH[n]
    for k, i in enumerate(pattern):
        note(PIANO, vo[i], bar(b) + k * TPB, TPB, v - (k % 2) * 6)
    note(PIANO, root + 12, bar(b), BAR // 2, v - 8)


def hit(t, v=92):
    note(DRUMS, 49, sec(t), TPB * 2, v)
    note(TIMP, 38, sec(t), TPB * 2, v)


def pizz(t, p, v=60):
    note(PIZZ, p, sec(t), E8, v)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {PIANO: 92, STR: 78, BASS: 80, CEL: 70, PIZZ: 74, TIMP: 90, DRUMS: 70}.items():
        cc(ch, 7, vol)
    for ch, pan in {PIZZ: 84, CEL: 44}.items():
        cc(ch, 10, pan)
    for ch in (PIANO, STR, CEL):
        cc(ch, 91, 64)

    hit(0.27)  # dash landing
    strings(0, "Bm", 36); piano(0, "Bm", 40)
    strings(1, "G", 34); piano(1, "G", 38)
    note(DRUMS, 57, sec(3.93), TPB, 74)  # padlock
    note(TIMP, 33, sec(3.93), TPB, 70)
    strings(2, "Em", 30)  # "why would he fear" - piano drops out
    # bars 3-4: 2007 storybook, music-box celesta + pizz
    for b, n in [(3, "D"), (4, "A")]:
        strings(b, n, 34); piano(b, n, 42, (0, 1, 2, 1))
    for k, p in enumerate([74, 78, 81, 86]):
        note(CEL, p, sec(9.73) + k * E16, TPB, 60)  # AWESOME
    # bar 5 (12.6-15.2): positivity, bright
    strings(5, "G", 40); piano(5, "G", 46)
    for k in range(6):
        pizz(13.1 + k * 0.32, [74, 78, 81, 78, 83, 86][k], 54)
    # bar 6 (15.2-17.7): unpredictable pings - irregular celesta, minor turn
    strings(6, "F#m", 32)
    for t in [15.0, 15.43, 15.7, 16.23, 16.47]:
        note(CEL, 88, sec(t), E8, 52)
    # 18.57 quote re-hook: timpani roll into a hit, sustained Bm
    for k in range(8):
        note(TIMP, 38, sec(17.9) + k * E16, E16, 40 + k * 6)
    hit(18.57, 96)
    strings(7, "Bm", 44, 1.0)
    # bar 8 (20.2-22.7): blocked list - pizz stabs on the stamps
    strings(8, "Em", 36)
    for t in [20.9, 21.6, 22.1]:
        pizz(t, 47, 82); note(TIMP, 35, sec(t), E8, 70)
    # bars 9-10: ask first - warm lift to D / Gmaj7
    strings(9, "D", 40); piano(9, "D", 46)
    strings(10, "Gmaj7", 40); piano(10, "Gmaj7", 44)
    for k, p in enumerate([74, 78, 81, 85]):
        note(CEL, p, sec(25.8) + k * E16, TPB, 64)
    # bar 11 back to Bm (loops to bar 0)
    strings(11, "Bm", 34); piano(11, "Bm", 38)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v015-like-regret.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
