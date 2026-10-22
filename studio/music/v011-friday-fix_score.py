#!/usr/bin/env python3
"""Score for V011 "POV: Friday 5 PM quick fix" — playful comedic bounce, 126 BPM, sparse under the voice.

1 bar = 1.905 s. Sections follow the storyboard (voice frames at 30 fps):
  bars 0-3   desk / "quick fix"      pizzicato + marimba staccato, tuba on 1 (C major, light)
  bars 4-6   dominoes topple          tuba walks down chromatically, tom hits, clarinet trill (tension)
  bars 7-8   "one line / all of it"   drop-out: lone celesta + sad slide-down on trombone
  bars 9-10  "ship it Monday"         bright C-F-G bounce, ends on the bar-0 chord (loop)
Original music. Writes v011-friday-fix.mid next to this file.
"""
import os
import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))
PIZZ, MAR, TUBA, CLAR, CELE, TBN, DR = 0, 1, 2, 3, 4, 5, 9
PROG = {PIZZ: 45, MAR: 12, TUBA: 58, CLAR: 71, CELE: 8, TBN: 57}
ev = []


def note(ch, p, s, d, v):
    ev.append((int(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    ev.append((int(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def b(n):
    return n * BAR


E8 = TPB // 2
CH = {"C": (36, [60, 64, 67]), "F": (41, [60, 65, 69]), "G": (43, [59, 62, 67]), "Am": (45, [60, 64, 69]), "Dm": (38, [62, 65, 69])}


def bounce(n, name, mar=True, vel=1.0):
    root, v = CH[name]
    s = b(n)
    note(TUBA, root, s, E8, int(80 * vel))
    note(TUBA, root + 7, s + 2 * TPB, E8, int(66 * vel))
    for k, off in enumerate([TPB, 3 * TPB]):  # pizz off-beat chords
        for p in v:
            note(PIZZ, p, s + off, E8 // 2, int(60 * vel))
    if mar:  # short marimba hook in the gap at the end of the bar
        for k, p in enumerate([v[0] + 12, v[1] + 12, v[2] + 12]):
            note(MAR, p, s + 3 * TPB + k * (TPB // 3), TPB // 3, int(70 * vel))


def main():
    for ch, pg in PROG.items():
        ev.append((0, 0, mido.Message("program_change", channel=ch, program=pg)))
    for ch, vol in {PIZZ: 96, MAR: 92, TUBA: 100, CLAR: 70, CELE: 84, TBN: 88, DR: 84}.items():
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (PIZZ, MAR, CELE, CLAR):
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=60)))

    for i, n in enumerate(["C", "Am", "F", "G"]):  # bars 0-3
        bounce(i, n, mar=(i % 2 == 1), vel=0.85)
    note(DR, 81, b(1) + 3 * TPB, E8, 70)  # triangle 'ding' near "five PM"
    # bars 4-6: tension — chromatic tuba walk-down + tom hits on the topples
    walk = [48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37]
    for k, p in enumerate(walk):
        note(TUBA, p, b(4) + k * TPB, TPB - 40, 84 + k)
    for n in range(4, 7):
        for p in CH["Dm"][1]:
            note(PIZZ, p, b(n) + TPB, E8 // 2, 64)
            note(PIZZ, p + 1, b(n) + 3 * TPB, E8 // 2, 64)
        note(DR, 45 + (n - 4) * 2, b(n), E8, 92)
        note(DR, 47 + (n - 4) * 2, b(n) + 2 * TPB + E8, E8, 84)
    for k in range(8):  # clarinet trill rising into the weekend
        note(CLAR, 74 + (k % 2) + (k // 4) * 2, b(6) + 2 * TPB + k * (TPB // 4), TPB // 4, 66)
    note(DR, 49, b(7), TPB, 96)  # crash = Sunday falls
    # bars 7-8: drop-out, lonely celesta + sad slide
    for k, p in enumerate([72, 76, 79, 76]):
        note(CELE, p, b(7) + TPB + k * TPB // 2 * 2, TPB, 54)
    for k, p in enumerate([67, 66, 65, 64]):
        note(TBN, p, b(8) + k * TPB, TPB - 20 if k < 3 else TPB * 2, 72)
    # bars 9-10: bright resolve, back to C (loop)
    for i, n in enumerate(["F", "G"]):
        bounce(9 + i, n, mar=True)
    note(DR, 81, b(9) + 2 * TPB, E8, 80)
    note(TUBA, 36, b(10) + 3 * TPB, E8, 70)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(126), time=0))
    last = 0
    for t, _, m in sorted(ev, key=lambda e: (e[0], e[1])):
        tr.append(m.copy(time=t - last))
        last = t
    out = os.path.join(HERE, "v011-friday-fix.mid")
    mid.save(out)
    print(f"wrote {out} ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
