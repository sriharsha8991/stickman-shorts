#!/usr/bin/env python3
"""Score for H02 "Your step sweet spot depends on your age" — rising pulse into a hit on the number, 120 BPM.

1 bar = 2 s (60 frames). Sections (voice frames at 30 fps):
  bars 0-5   staircase + receipt + counter   soft synth-bass pulse in eighths, EP stabs climbing the scale
                                              each bar (stairs), shaker; velocity builds bar by bar
  bar 5-6    riser (rising EP 16ths) -> HIT at 12.7 s ("forty"): brass stab + crash + low boom
  bars 7-11  "the stairs flatten"            plateau: choir pad holds, bass drops to half notes (calm, flat)
  bars 12-14 "a few hundred more"            light step-up arps return (stairs again), warm
  bars 15-16 loop                            same as bars 0-1
Original music. Writes h02-step-sweet-spot.mid.
"""
import os
import mido

TPB = 480
BAR = TPB * 4
TPS = TPB * 2  # ticks per second at 120 BPM
HERE = os.path.dirname(os.path.abspath(__file__))
SB, EP, PAD, BRASS, VIB, DR = 0, 1, 2, 3, 4, 9
PROG = {SB: 38, EP: 5, PAD: 52, BRASS: 61, VIB: 11}
ev = []


def note(ch, p, s, d, v):
    ev.append((int(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, v)))))
    ev.append((int(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def b(n):
    return n * BAR


E8 = TPB // 2
E16 = TPB // 4
PROGRESSION = [("D", 38, [62, 66, 69]), ("Bm", 35, [62, 66, 71]), ("G", 31, [62, 67, 71]), ("A", 33, [61, 64, 69])]


def pulse(n, k, vel):
    _, root, v = PROGRESSION[k % 4]
    s = b(n)
    for i in range(8):
        note(SB, root + (12 if i % 4 == 3 else 0), s + i * E8, E8 - 40, int(vel * (78 if i % 2 == 0 else 60)))
    # stairs: EP climbs one chord tone per beat
    for i in range(4):
        note(EP, v[i % 3] + (12 if i == 3 else 0), s + i * TPB, E8, int(vel * 58))
    for i in range(8):
        note(DR, 70, s + i * E8, E16, int(vel * (46 if i % 2 else 34)))  # maracas


def main():
    for ch, pg in PROG.items():
        ev.append((0, 0, mido.Message("program_change", channel=ch, program=pg)))
    for ch, vol in {SB: 96, EP: 92, PAD: 76, BRASS: 96, VIB: 84, DR: 86}.items():
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (EP, PAD, VIB, BRASS):
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=70)))

    for n in range(0, 6):
        pulse(n, n, 0.7 + n * 0.05)
    # riser: rising 16ths into the hit
    hit = int(12.7 * TPS)
    start = hit - 2 * TPB
    for i in range(8):
        note(EP, 62 + i * 2, start + i * E16, E16, 54 + i * 6)
    note(DR, 49, hit, TPB, 110)
    note(DR, 36, hit, E8, 120)
    for p in [50, 62, 66, 69, 74]:
        note(BRASS, p, hit, TPB + E8, 104)
    # plateau bars 7-11: choir holds, bass halves (flat, calm)
    for n in range(7, 12):
        _, root, v = PROGRESSION[(n - 7) % 2 * 2]  # D / G only, hovering
        for p in v:
            note(PAD, p - 12, b(n), BAR, 52)
        note(SB, root, b(n), TPB * 2 - 40, 62)
        note(SB, root, b(n) + 2 * TPB, TPB * 2 - 40, 54)
        note(VIB, v[2] + 12, b(n) + 3 * TPB + E8, E8, 46)
    # step-up arps return bars 12-14
    for n in range(12, 15):
        pulse(n, n - 12, 0.75)
        for i in range(4):
            note(VIB, PROGRESSION[(n - 12) % 4][2][i % 3] + 12 + (12 if i == 3 else 0), b(n) + i * TPB + E8, E8, 50 + i * 6)
    note(DR, 81, b(14) + 2 * TPB, E8, 74)  # triangle on "first step"
    # loop bars 15-16
    pulse(15, 0, 0.7)
    pulse(16, 1, 0.72)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(120), time=0))
    last = 0
    for t, _, m in sorted(ev, key=lambda e: (e[0], e[1])):
        tr.append(m.copy(time=t - last))
        last = t
    out = os.path.join(HERE, "h02-step-sweet-spot.mid")
    mid.save(out)
    print(f"wrote {out} ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
