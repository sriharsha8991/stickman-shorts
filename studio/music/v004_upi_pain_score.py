#!/usr/bin/env python3
"""Score for V004 "UPI made spending stop hurting" (v004-upi-pain).

Fight energy, 130 BPM, D minor -> D major on the verdict. Original MIDI: drums + brass stabs + bass,
kept sparse under Spark's voice. Hits are placed on video frames from voice.ts:
  f 0-246     intro "CASH vs UPI"       brass stabs on Cash / versus / UPI, low tom pulse
  f 246-435   round 1 (cash)            fanfare stab, kick pulse, low brass "ouch" stab on each note
  f 435-546   round 2 (UPI)             fanfare stab, light bright pluck (frictionless), no brass
  f 546-903   receipts                  soft kick/hat, string pad (tension)
  f 903-951   "who really wins?"        snare roll riser
  f 951       "Cash."                   brass fanfare + crash (major)
  f 1036-end  payoff                    light groove, ends on a single tick (loop)
Writes v004-upi-pain.mid next to this file.
"""
import os

import mido

TPB = 480
BPM = 130
HERE = os.path.dirname(os.path.abspath(__file__))
BRASS, BASS, PLUCK, STR, DRUMS = 0, 1, 2, 3, 9
PROGRAMS = {BRASS: 61, BASS: 38, PLUCK: 45, STR: 49}
BEAT_F = 30 * 60 / BPM
events = []


def fr(frame):
    return int(round(frame / BEAT_F * TPB))


def note(ch, p, start, dur, vel):
    events.append((start, 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, vel)))))
    events.append((start + dur, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, start, dur, vel):
    for p in ps:
        note(ch, p, start, dur, vel)


E8 = TPB // 2
E16 = TPB // 4
Dm = [50, 53, 57]
Bb = [46, 50, 53]
A = [45, 49, 52]
D = [50, 54, 57]


def stab(frame, ps, vel=88, dur=E8):
    chord(BRASS, [p + 12 for p in ps], fr(frame), dur, vel)
    note(BASS, ps[0] - 12, fr(frame), dur, vel)
    note(DRUMS, 36, fr(frame), E8, vel)


def pulse(f0, f1, kick=70, hat=40, toms=False):
    t = fr(f0)
    k = 0
    while t < fr(f1):
        if k % 2 == 0:
            note(DRUMS, 45 if toms else 36, t, E8, kick)
        note(DRUMS, 42, t + E8, E16, hat)
        t += TPB
        k += 1


def bassline(f0, f1, roots, vel=62):
    t = fr(f0)
    k = 0
    while t < fr(f1):
        r = roots[(k // 8) % len(roots)]
        note(BASS, r - 12 + (12 if k % 4 == 3 else 0), t, E8 - 20, vel if k % 2 == 0 else vel - 14)
        t += E8
        k += 1


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {BRASS: 88, BASS: 96, PLUCK: 84, STR: 70, DRUMS: 92}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (BRASS, PLUCK, STR):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=55)))

    # intro
    stab(6, Dm, 96)
    stab(15, Bb, 90)
    stab(30, A, 100, TPB)
    pulse(57, 246, kick=58, hat=0, toms=True)
    bassline(57, 246, [50, 46], vel=54)
    # round 1: cash
    stab(246, D, 100, TPB)
    note(DRUMS, 49, fr(246), TPB, 80)
    pulse(270, 435, kick=62, hat=36)
    for t in [296, 316, 332, 348, 355]:
        chord(BRASS, [41, 44], fr(t + 12), E8, 70)  # low "ouch"
    # round 2: UPI, frictionless
    stab(435, D, 100, TPB)
    note(DRUMS, 49, fr(435), TPB, 80)
    t = fr(460)
    k = 0
    while t < fr(546):
        note(PLUCK, [74, 78, 81, 86][k % 4], t, E16, 46)
        t += E8
        k += 1
    # receipts: tension
    pulse(546, 903, kick=50, hat=30)
    for i, ps in enumerate([Dm, Bb, Dm, A]):
        chord(STR, [p + 12 for p in ps], fr(546) + i * TPB * 6, TPB * 6, 44)
    bassline(546, 903, [50, 46, 50, 45], vel=48)
    # riser into the verdict
    for k in range(16):
        note(DRUMS, 38, fr(903) + k * (fr(951) - fr(903)) // 16, E16, 40 + k * 4)
    # verdict: fanfare
    chord(BRASS, [62, 66, 69], fr(951), TPB, 104)
    chord(BRASS, [64, 67, 71], fr(951) + TPB, E8, 96)
    chord(BRASS, [66, 69, 74], fr(951) + TPB + E8, TPB * 2, 108)
    note(BASS, 38, fr(951), TPB * 3, 100)
    note(DRUMS, 49, fr(951), TPB * 2, 96)
    note(DRUMS, 36, fr(951), E8, 110)
    chord(STR, [62, 66, 69], fr(970), fr(1036) - fr(970), 50)
    # payoff groove
    pulse(1036, 1170, kick=58, hat=34)
    bassline(1036, 1170, [50, 55, 57, 50], vel=52)
    stab(1036, D, 80)
    note(DRUMS, 37, fr(1170), E16, 60)  # final tick (loop)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v004-upi-pain.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
