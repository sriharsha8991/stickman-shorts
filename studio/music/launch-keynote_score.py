#!/usr/bin/env python3
"""Original score for the 15 s keynote-style channel launch "Introducing The Hidden Mechanism" (launch-15/keynote).
90 BPM feel, A minor → C major lift. Cinematic: warm pads, a pulsing synth arp, choir swell, reverse-cymbal riser,
timpani/taiko impacts, celesta motif for Spark. Hits (s): 0 orb · 1.6 orbit · 4.0 brain · 5.8–7.4 riser → 7.4 bloom
impact · 8.2 Spark motif · 10.2–10.6 drop · 10.6 TITLE hit · 12.8 'now live' chime · 14.4 fade (loops to the orb)."""
import os
import mido

TPB, BPM = 480, 90
HERE = os.path.dirname(os.path.abspath(__file__))
PAD, SWEEP, STR, CHOIR, CEL, ARP, BASS, TIMP, REV, TAIKO, DR = 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 9
PROG = {PAD: 89, SWEEP: 95, STR: 48, CHOIR: 52, CEL: 8, ARP: 81, BASS: 38, TIMP: 47, REV: 119, TAIKO: 116}
ev = []
T = lambda s: int(round(s * TPB * BPM / 60))
E16 = TPB // 4


def note(ch, p, t, d, v):
    ev.append((t, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    ev.append((t + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, t, d, v):
    for p in ps:
        note(ch, p, t, d, v)


def arp(t0, t1, notes, v0, v1):
    t, end, k = T(t0), T(t1), 0
    n = max(1, (end - t) // E16)
    while t < end:
        note(ARP, notes[k % len(notes)], t, E16 - 10, int(v0 + (v1 - v0) * k / n))
        t += E16
        k += 1


def impact(s, big=True):
    t = T(s)
    note(TIMP, 33, t, T(1.2), 120)
    note(TAIKO, 41, t, T(0.6), 120 if big else 90)
    note(DR, 36, t, E16 * 2, 127)
    note(DR, 57 if big else 49, t, T(2.0), 110 if big else 80)
    note(BASS, 33, t, T(1.5), 110)


def main():
    for ch, p in PROG.items():
        ev.append((0, 0, mido.Message("program_change", channel=ch, program=p)))
    for ch, v in {PAD: 92, SWEEP: 70, STR: 84, CHOIR: 80, CEL: 86, ARP: 64, BASS: 100, TIMP: 110, REV: 96, TAIKO: 110, DR: 100}.items():
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=v)))
    for ch in (PAD, SWEEP, STR, CHOIR, CEL, ARP):
        ev.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=90)))
    # 0–4: Am pad breathing, low heartbeat on the orb
    chord(PAD, [45, 52, 57, 60], 0, T(4.0), 58)
    for s in (0.0, 1.33, 2.67):
        note(DR, 36, T(s), E16, 70); note(DR, 36, T(s + 0.22), E16, 50)
    note(CEL, 81, T(0.05), T(0.6), 60)
    arp(1.6, 4.0, [69, 72, 76, 72], 30, 55)  # orbit
    # 4.0–7.4: brain, F → G, choir swell, arp thicker, riser
    chord(PAD, [41, 53, 57, 60], T(4.0), T(1.8), 64)
    chord(PAD, [43, 55, 59, 62], T(5.8), T(1.6), 70)
    chord(CHOIR, [57, 60, 64], T(4.0), T(3.3), 60)
    note(BASS, 29, T(4.0), T(1.8), 80); note(BASS, 31, T(5.8), T(1.6), 84)
    arp(4.0, 7.2, [65, 69, 72, 77, 72, 69], 50, 80)
    note(REV, 60, T(5.6), T(1.8), 110)
    chord(STR, [55, 62, 67], T(6.2), T(1.2), 70)
    # 7.4: bloom impact, C major lift
    impact(7.4)
    chord(STR, [48, 55, 60, 64, 67, 72], T(7.4), T(2.6), 96)
    chord(CHOIR, [60, 64, 67, 72], T(7.4), T(2.6), 84)
    chord(SWEEP, [48, 55, 64], T(7.4), T(2.8), 70)
    # 8.2–10.2: Spark motif on celesta over C/G pad
    for k, p in enumerate([72, 76, 79, 84, 79, 83, 86]):
        note(CEL, p, T(8.3) + k * T(0.26), T(0.4), 84 - k * 3)
    chord(PAD, [43, 55, 59, 62], T(10.0), T(0.25), 50)
    note(REV, 64, T(9.4), T(1.2), 100)
    # 10.2–10.6 drop (silence), 10.6 TITLE hit
    impact(10.6)
    chord(STR, [41, 53, 57, 60, 65, 69], T(10.6), T(3.8), 100)  # F major lift
    chord(CHOIR, [57, 60, 65, 69], T(10.6), T(3.8), 90)
    chord(SWEEP, [41, 53, 60], T(10.6), T(4.0), 74)
    arp(10.9, 14.2, [77, 81, 84, 89, 84, 81], 55, 40)
    for s in (11.93, 13.27):
        note(DR, 36, T(s), E16, 90); note(TAIKO, 41, T(s), E16 * 2, 80)
    # 12.8: now live chime
    for k, p in enumerate([84, 89, 93]):
        note(CEL, p, T(12.8) + k * E16, T(0.5), 80)
    # 14.0 resolve to the opening Am color (loop)
    chord(PAD, [45, 52, 57, 60], T(14.0), T(1.0), 50)
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for t, _, m in sorted(ev, key=lambda e: (e[0], e[1])):
        tr.append(m.copy(time=t - last)); last = t
    out = os.path.join(HERE, "launch-keynote.mid"); mid.save(out); print("wrote", out, round(mid.length, 1))


if __name__ == "__main__":
    main()
