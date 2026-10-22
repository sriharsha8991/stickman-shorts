#!/usr/bin/env python3
"""Score for V012 "Nobody buys the medium popcorn" — lo-fi keys + marimba, curious -> build -> reveal, 120 BPM.

1 bar = 2 s. Sections (voice seconds):
  bars 0-6   (0-13.8 s)  curious: Rhodes 9th chords on 1 and the "and" of 2, marimba plinks only in gaps, soft hat
  13.83 s    "decoy"     HIT: riser (marimba 16ths) -> crash + low boom + vibes chord
  bars 7-12  (14-26 s)   build: walking bass + kick/rim enter for the magazine test, velocity climbs
  26.07 s    "84%"       HIT: riser -> crash + brass-ish stab
  bars 13-15 (26-32 s)   calm: bass drops out, Rhodes half notes ("works best when you're torn")
  bars 16-18 (32-36 s)   payoff/loop: bright major lift, marimba motif returns (loops into bar 0)
Original music. Writes v012-decoy-popcorn.mid.
"""
import os
import mido

TPB = 480
BAR = TPB * 4
TPS = TPB * 2
HERE = os.path.dirname(os.path.abspath(__file__))
KEYS, MAR, BASS, VIB, BR, DR = 0, 1, 2, 3, 4, 9
PROG = {KEYS: 4, MAR: 12, BASS: 33, VIB: 11, BR: 61}
ev = []


def note(ch, p, s, d, v):
    ev.append((int(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    ev.append((int(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def b(n):
    return n * BAR


E8, E16 = TPB // 2, TPB // 4
# Dm9 - G13 - Cmaj9 - A7b9 (lo-fi ii-V-I turnaround in C)
CH = [(38, [53, 57, 60, 64]), (43, [53, 57, 59, 64]), (36, [52, 55, 59, 62]), (33, [55, 58, 61, 64])]
MOTIF = [76, 74, 72, 69]


def keys(n, k, vel, comp=True):
    root, v = CH[k % 4]
    for p in v:
        note(KEYS, p, b(n), TPB + E8, vel * 60)
        if comp:
            note(KEYS, p, b(n) + TPB + E8, E8, vel * 44)


def hat(n, vel):
    for i in range(8):
        note(DR, 42, b(n) + i * E8, E16, vel * (40 if i % 2 else 28))


def hit(sec, bigger=False):
    t = int(sec * TPS)
    for i in range(8):
        note(MAR, 67 + i * 2, t - 2 * TPB + i * E16, E16, 50 + i * 7)
    note(DR, 49, t, TPB, 112)
    note(DR, 36, t, E8, 120)
    note(BASS, 26, t, TPB * 2, 110)
    for p in [62, 65, 69, 72] + ([76] if bigger else []):
        note(VIB, p, t, TPB * 2, 92)
    if bigger:
        for p in [50, 57, 62, 65]:
            note(BR, p, t, TPB + E8, 96)


def main():
    for ch, pg in PROG.items():
        ev.append((0, 0, mido.Message("program_change", channel=ch, program=pg)))
    for ch, vol in {KEYS: 92, MAR: 90, BASS: 96, VIB: 84, BR: 92, DR: 82}.items():
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (KEYS, MAR, VIB, BR):
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=72)))

    # curious intro (bars 0-6)
    for n in range(0, 7):
        keys(n, n, 0.75)
        hat(n, 0.7)
        note(BASS, CH[n % 4][0], b(n), TPB * 2, 70)
        if n in (0, 2, 4):  # plinks only in the gap at the end of the bar
            for i, p in enumerate(MOTIF[:2]):
                note(MAR, p, b(n) + 3 * TPB + i * E8, E8, 54)
    hit(13.83)
    # build (bars 7-12): walking bass, kick + rim
    for n in range(7, 13):
        k = n - 7
        vel = 0.75 + k * 0.04
        keys(n, k, vel)
        hat(n, vel)
        root = CH[k % 4][0]
        for i, p in enumerate([root, root + 4, root + 7, root + 9]):
            note(BASS, p, b(n) + i * TPB, TPB - 30, 74 + k * 3)
        note(DR, 36, b(n), E8, 70 + k * 4)
        note(DR, 36, b(n) + 2 * TPB + E8, E8, 60 + k * 4)
        note(DR, 37, b(n) + TPB, E16, 52)
        note(DR, 37, b(n) + 3 * TPB, E16, 56)
    hit(26.07, bigger=True)
    # calm (bars 13-15): half notes, no bass
    for n in range(14, 16):
        root, v = CH[(n - 14) * 2 % 4]
        for p in v:
            note(KEYS, p, b(n), TPB * 2, 46)
            note(KEYS, p, b(n) + 2 * TPB, TPB * 2, 40)
    # payoff / loop (bars 16-18): bright lift, motif returns
    for n in range(16, 19):
        keys(n, (n - 16) % 4, 0.8)
        hat(n, 0.75)
        note(BASS, CH[(n - 16) % 4][0], b(n), TPB * 2, 72)
        for i, p in enumerate(MOTIF):
            note(MAR, p + (2 if n == 17 else 0), b(n) + 2 * TPB + i * E8, E8, 58)
    note(VIB, 84, int(31.87 * TPS), TPB, 70)  # ping on "cross"

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(120), time=0))
    last = 0
    for t, _, m in sorted(ev, key=lambda e: (e[0], e[1])):
        tr.append(m.copy(time=t - last))
        last = t
    out = os.path.join(HERE, "v012-decoy-popcorn.mid")
    mid.save(out)
    print(f"wrote {out} ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
