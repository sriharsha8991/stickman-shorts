#!/usr/bin/env python3
"""Score for H13 "21 days to form a habit is a myth" — playful comedic bounce, pizzicato + marimba, 126 BPM.

Sections (voice seconds):
  0-13.9 s   MYTH: bouncy pizzicato oom-pah in A minor, tuba bass, wood block; a "wah" fall on "never"
  13.9 s     REALITY: key change to C major, glockenspiel enters, riser of pizz 16ths
  18.17 s    "sixty-six"  HIT: crash + timpani + bright brass chord
  21.43 s    "two fifty-four" second accent (timpani roll + cymbal)
  22-30 s    walking pizz, lighter; thins out under the caveat (26.3 s)
  30.03 s    "barely mattered" glock ping + lift
  31-36 s    payoff/loop: bounce returns, ends on a pickup into bar 0
Original music. Writes h13-habit-21-days.mid.
"""
import os
import mido

BPM = 126
TPB = 480
BAR = TPB * 4
TPS = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
PIZZ, MAR, TUBA, GLOCK, BR, TIMP, DR = 0, 1, 2, 3, 4, 5, 9
PROG = {PIZZ: 45, MAR: 12, TUBA: 58, GLOCK: 9, BR: 61, TIMP: 47}
ev = []


def note(ch, p, s, d, v):
    ev.append((int(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    ev.append((int(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def sec(x):
    return int(x * TPS)


E8, E16 = TPB // 2, TPB // 4
MINOR = [(45, [57, 60, 64]), (40, [56, 59, 64]), (45, [57, 60, 64]), (41, [57, 60, 65])]  # Am E Am F
MAJOR = [(36, [60, 64, 67]), (41, [60, 65, 69]), (43, [59, 62, 67]), (36, [60, 64, 67])]  # C F G C


def bounce(t0, prog, k, vel, glock=False, wood=True):
    root, v = prog[k % 4]
    for beat in range(4):
        s = t0 + beat * TPB
        if beat % 2 == 0:
            note(TUBA, root, s, E8, vel * 80)
        else:
            for p in v:
                note(PIZZ, p, s, E8, vel * 62)
        if wood:
            note(DR, 76 if beat % 2 else 77, s + E8, E16, vel * 40)
    if glock:
        for i, p in enumerate([v[2] + 12, v[1] + 12]):
            note(GLOCK, p, t0 + 3 * TPB + i * E8, E8, vel * 52)


def main():
    for ch, pg in PROG.items():
        ev.append((0, 0, mido.Message("program_change", channel=ch, program=pg)))
    for ch, vol in {PIZZ: 96, MAR: 88, TUBA: 92, GLOCK: 80, BR: 92, TIMP: 96, DR: 84}.items():
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (PIZZ, MAR, GLOCK, BR):
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=64)))

    reality = sec(13.87)
    n = 0
    t = 0
    while t + BAR <= reality - TPB:
        bounce(t, MINOR, n, 0.72 + 0.02 * (n % 3))
        if n % 2 == 1:
            for i, p in enumerate([69, 72, 71, 69]):
                note(MAR, p, t + 2 * TPB + i * E16, E16, 50)
        n += 1
        t += BAR
    # "wah" fall on "never" (~4.6 s): descending tuba
    for i, p in enumerate([52, 51, 50, 49]):
        note(TUBA, p, sec(4.6) + i * E8, E8, 70)
    # riser into the hit
    hit = sec(18.17)
    for i in range(16):
        note(PIZZ, 60 + i, reality + i * ((hit - reality) // 16), E16, 46 + i * 3)
    for i in range(int((hit - reality) // TPB)):
        note(GLOCK, [72, 76, 79, 84][i % 4], reality + i * TPB, E8, 50 + i * 4)
    note(DR, 49, hit, TPB, 112)
    note(TIMP, 36, hit, TPB, 118)
    for p in [48, 60, 64, 67, 72]:
        note(BR, p, hit, TPB + E8, 100)
    # second accent on 254
    a2 = sec(21.43)
    for i in range(6):
        note(TIMP, 43, a2 - 6 * E16 + i * E16, E16, 60 + i * 9)
    note(DR, 57, a2, TPB, 100)
    note(BR, 55, a2, TPB, 84)
    # walking section 22-30 s, thinner under the caveat
    t = sec(22.2)
    k = 0
    while t + BAR <= sec(30.0):
        light = t >= sec(26.0)
        bounce(t, MAJOR, k, 0.55 if light else 0.7, glock=not light, wood=not light)
        k += 1
        t += BAR
    note(GLOCK, 88, sec(30.03), TPB, 82)
    note(GLOCK, 91, sec(30.03) + E8, TPB, 74)
    # payoff / loop
    t = sec(30.6)
    k = 0
    while t < sec(36.0):
        bounce(t, MAJOR, k, 0.78, glock=True)
        k += 1
        t += BAR
    note(DR, 81, sec(34.97), E8, 76)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tt, _, m in sorted(ev, key=lambda e: (e[0], e[1])):
        tr.append(m.copy(time=tt - last))
        last = tt
    out = os.path.join(HERE, "h13-habit-21-days.mid")
    mid.save(out)
    print(f"wrote {out} ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
