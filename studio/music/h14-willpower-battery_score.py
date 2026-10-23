#!/usr/bin/env python3
"""Score for H14 "Willpower isn't a battery" (h14-willpower-battery).

Night synthwave, 100 BPM (bar = 2.4 s), 12 bars ≈ 28.8 s, A minor. Sparse under the voice (different from
V014's lo-fi marimba): warm saw pad + slow arp, synth bass, gated kick only in the gaps.
  0.47 s  beam hit (crash + low boom)           bars 0-1  hook: pad Am / F, arp quiet
  bars 2-4 the test: arp gets busier, kick on 1; 10.5 s "crash" -> drop to pad only
  14.3 s  "zero" re-hook: reverse-swell then hit + bright Cmaj7 (major lift)
  17.2 s  SAME stamp accent                     bars 8-9  caveat: pad + bass, tension (Dm7 / E7sus)
  24.7 s  "start" bloom (F -> G), bar 11 back to Am (loops to bar 0)
"""
import os
import mido

TPB = 480
BPM = 100
BAR = TPB * 4
SEC_PER_BAR = 4 * 60 / BPM
HERE = os.path.dirname(os.path.abspath(__file__))
PAD, ARP, BASS, BELL, DRUMS = 0, 1, 2, 3, 9
PROGRAMS = {PAD: 90, ARP: 81, BASS: 38, BELL: 98}
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
    "Am": (33, [57, 60, 64]),
    "F": (29, [57, 60, 65]),
    "C": (36, [55, 60, 64]),
    "G": (31, [55, 59, 62]),
    "Cmaj7": (36, [59, 64, 67, 71]),
    "Dm7": (38, [57, 60, 62, 65]),
    "E7sus": (40, [57, 62, 64, 68]),
}


def pad(b, n, v=40):
    root, vo = CH[n]
    for p in vo:
        note(PAD, p - 12, bar(b), BAR, v)
    note(BASS, root, bar(b), BAR - E8, 50)


def arp(b, n, dens=4, v=40):
    _, vo = CH[n]
    step = BAR // (dens * 2)
    for k in range(dens * 2):
        note(ARP, vo[k % len(vo)] + 12, bar(b) + k * step, step, v - (k % 2) * 8)


def kick(b, v=60):
    note(DRUMS, 36, bar(b), E8, v)
    note(DRUMS, 36, bar(b) + 2 * TPB, E8, v - 10)


def hit(t, v=96):
    note(DRUMS, 49, sec(t), TPB * 2, v)
    note(DRUMS, 36, sec(t), E8, v)
    note(BASS, 28, sec(t), TPB * 2, 80)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {PAD: 84, ARP: 70, BASS: 96, BELL: 76, DRUMS: 84}.items():
        cc(ch, 7, vol)
    for ch, pan in {ARP: 80, BELL: 44}.items():
        cc(ch, 10, pan)
    for ch in (PAD, ARP, BELL):
        cc(ch, 91, 70)

    hit(0.47)
    for b, n in [(0, "Am"), (1, "F")]:
        pad(b, n)
        arp(b, n, 2, 34)
    for b, n in [(2, "Am"), (3, "F")]:
        pad(b, n)
        arp(b, n, 4, 40)
        kick(b)
    # bar 4 (9.6-12 s): "crash" at 10.5 s -> drop out
    pad(4, "E7sus", 34)
    note(DRUMS, 57, sec(10.5), TPB, 80)
    note(BASS, 28, sec(10.5), TPB, 70)
    # bar 5 (12-14.4): suspense, bells rising into "zero"
    pad(5, "Dm7", 30)
    for k in range(6):
        note(BELL, [69, 72, 74, 76, 79, 81][k], sec(12.9) + k * E16 * 2, E8, 40 + k * 7)
    hit(14.33, 100)
    for k, p in enumerate([76, 79, 83, 88]):
        note(BELL, p, sec(14.33) + k * E16, TPB, 82)
    pad(6, "Cmaj7", 46)
    arp(6, "Cmaj7", 4, 44)
    pad(7, "G", 42)
    arp(7, "G", 4, 40)
    note(DRUMS, 39, sec(17.23), E8, 90)  # SAME stamp
    for b, n in [(8, "Dm7"), (9, "E7sus")]:
        pad(b, n, 36)
    pad(10, "F", 44)
    arp(10, "F", 4, 42)
    kick(10, 54)
    hit(24.7, 84)
    for k, p in enumerate([72, 76, 79, 84]):
        note(BELL, p, sec(24.7) + k * E16, TPB, 70)
    pad(11, "Am", 38)
    arp(11, "Am", 2, 32)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "h14-willpower-battery.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
