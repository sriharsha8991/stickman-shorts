#!/usr/bin/env python3
"""Original score for the 15 s launch teaser "Same Strings" (launch-15). 108 BPM, D major, global pop-percussion:
claps, marimba, frame-drum (low conga/tom), pizzicato, bright glockenspiel. No voice, so the music carries the cuts.
Hits (s): 0 open · 2.13 tug · 4.0/4.73/5.53/6.27 world-tour cuts · 7.0 iris · 8.6 drop · 8.93 brain aha ·
10.0 hello · 11.6 snip · 12.2 logo · 14.4 reload (loops into 0)."""
import os
import mido

TPB, BPM = 480, 108
HERE = os.path.dirname(os.path.abspath(__file__))
MAR, GLOCK, BASS, PIZZ, PAD, BRASS, DR = 0, 1, 2, 3, 4, 5, 9
PROG = {MAR: 12, GLOCK: 9, BASS: 38, PIZZ: 45, PAD: 89, BRASS: 61}
ev = []
T = lambda s: int(round(s * TPB * BPM / 60))
E8, E16 = TPB // 2, TPB // 4


def note(ch, p, t, d, v):
    ev.append((t, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    ev.append((t + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, t, d, v):
    for p in ps:
        note(ch, p, t, d, v)


PROGS = {"D": (38, [62, 66, 69]), "G": (43, [62, 67, 71]), "Bm": (35, [62, 66, 71]), "A": (45, [61, 64, 69])}


def groove(t0, t1, prog, dense=1.0, mar=True):
    t, end, k = T(t0), T(t1), 0
    while t < end:
        root, v = PROGS[prog[(k // 8) % len(prog)]]
        if k % 4 == 0:
            note(DR, 36, t, E8, 92)
            note(BASS, root, t, E8, 86)
        if k % 8 == 3 or k % 8 == 6:
            note(BASS, root + 7, t, E16 * 3, 70)
        if k % 4 == 2:
            note(DR, 39, t, E8, 84)  # clap
        note(DR, 64 if k % 3 else 63, t, E16, 50 if k % 2 else 64)  # frame drum / congas
        if dense > 0.5:
            note(DR, 69, t + E16, E16, 36)  # shaker
        if mar and k % 2 == 0:
            note(MAR, v[(k // 2) % 3] + 12, t, E8, 62)
        t += E8
        k += 1


def hit(s, big=True):
    t = T(s)
    note(DR, 49, t, TPB * 2, 100 if big else 80)
    note(DR, 36, t, E8, 110)
    note(BASS, 38, t, TPB, 100)
    chord(BRASS, [62, 66, 69, 74], t, TPB if big else E8, 92 if big else 78)


def main():
    for ch, p in PROG.items():
        ev.append((0, 0, mido.Message("program_change", channel=ch, program=p)))
    for ch, v in {MAR: 96, GLOCK: 80, BASS: 92, PIZZ: 80, PAD: 64, BRASS: 78, DR: 100}.items():
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=v)))
    for ch in (MAR, GLOCK, PAD, BRASS):
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=56)))
    # 0–2.1: curious pizz + marimba, light
    note(GLOCK, 81, 0, TPB, 80)
    for k in range(8):
        note(PIZZ, [62, 69, 66, 69][k % 4], T(0.1) + k * E8, E8, 60)
    note(DR, 64, T(1.4), E16, 60); note(DR, 64, T(1.6), E16, 66); note(DR, 63, T(1.85), E16, 74)
    hit(2.13)
    groove(2.25, 4.0, ["D", "G"])
    for s in (4.0, 4.73, 5.53, 6.27):
        note(DR, 49, T(s), TPB, 72); note(GLOCK, 86, T(s), E8, 70)
    groove(4.0, 7.0, ["Bm", "G", "D", "A"])
    # 7.0 iris: whoosh-ish glock run + pad swell
    for k in range(8):
        note(GLOCK, 74 + k * 2, T(7.0) + k * (E16 // 2 + 20), E16, 50 + k * 5)
    chord(PAD, [50, 57, 62, 66], T(7.0), T(1.55), 46)
    for k in range(6):
        note(PIZZ, 62 + k, T(7.6) + k * E8 // 1, E8, 40 + k * 6)  # riser
    # drop 8.6–8.93 then the aha hit
    hit(8.93)
    for k, p in enumerate([74, 78, 81, 86]):
        note(GLOCK, p, T(8.93) + k * E16, E8, 80)
    groove(9.3, 11.4, ["D", "A"])
    # snip
    note(DR, 54, T(11.6), E8, 90); hit(11.6, big=False)
    # logo: full groove + brass stab
    hit(12.2)
    groove(12.4, 14.4, ["G", "A", "D"], mar=True)
    chord(PAD, [50, 57, 62, 66], T(12.2), T(2.2), 50)
    # reload into frame 0
    for k in range(4):
        note(DR, 64, T(14.4) + k * E16, E16, 60 + k * 8)
    note(GLOCK, 81, T(14.8), E8, 70)
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for t, _, m in sorted(ev, key=lambda e: (e[0], e[1])):
        tr.append(m.copy(time=t - last)); last = t
    out = os.path.join(HERE, "launch-15.mid"); mid.save(out); print("wrote", out, round(mid.length, 1))


if __name__ == "__main__":
    main()
