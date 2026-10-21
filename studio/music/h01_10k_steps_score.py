#!/usr/bin/env python3
"""Score for H01 "10,000 steps came from a pedometer, not a study" (h01-10k-steps).

Sunrise walking groove, 104 BPM, F major. Original MIDI: nylon guitar arpeggios, acoustic bass,
kalimba, string pad, light kit + maracas (a walking pulse). Myth vs Reality shape on spoken words:
  hook (0)             walking groove F / C, drops to Dm on "failed"
  myth (1-4)           thin: guitar + kalimba pentatonic for the 1965 pedometer, low hit on "MYTH"
  wipe (5)             cymbal swell into a hard hit (REALITY), then a light pulse for the pile
  curve (6-7)          string riser into a hit on "forty-seven"
  flattens (8)         soft resolve, kalimba sparkle on "modest" (the aha)
  payoff (9-10)        full bright walking groove F Bb C F
  end (11)             back to the hook groove (loops)
Writes h01-10k-steps.mid next to this file.
"""
import json
import os
import re

import mido

TPB = 480
BPM = 104
HERE = os.path.dirname(os.path.abspath(__file__))
EP, MAR, BASS, PAD, GLOCK, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {EP: 24, MAR: 108, BASS: 32, PAD: 49, GLOCK: 73}
BEAT_F = 30 * 60 / BPM
events = []

voice = open(os.path.join(HERE, "..", "src", "h01-10k-steps", "voice.ts")).read()
CUES = json.loads(re.search(r"VOICE_CUES: VCue\[\] = (\[.*?\]);", voice, re.S).group(1))
TOTAL = int(re.search(r"VOICE_FRAMES = (\d+)", voice).group(1))


def C(i):
    return CUES[i]["startFrame"]


def W(i, k):
    return CUES[i]["words"][k]["s"]


def fr(frame):
    return int(round(frame / BEAT_F * TPB))


def note(ch, p, f0, f1, vel):
    a, b = fr(f0), max(fr(f0) + 30, fr(f1))
    events.append((a, 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(vel))))))
    events.append((b, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, f0, f1, vel):
    for p in ps:
        note(ch, p, f0, f1, vel)


CH = {
    "F": (41, [53, 57, 60, 65]),
    "C": (36, [52, 55, 60, 64]),
    "Dm": (38, [50, 57, 62, 65]),
    "Bb": (34, [50, 53, 58, 62]),
    "Am": (45, [52, 57, 60, 64]),
}


def groove(f0, f1, prog, vel=42, drums=True):
    bar = BEAT_F * 4
    f = f0
    b = 0
    while f < f1 - 4:
        root, v = CH[prog[b % len(prog)]]
        order = [0, 2, 1, 3, 2, 1, 3, 2]
        for k in range(8):  # guitar arpeggio in 8ths
            t = f + k * BEAT_F / 2
            if t < f1:
                note(EP, v[order[k]] + 12, t, t + BEAT_F * 0.9, vel + (6 if k % 2 == 0 else 0))
        note(BASS, root, f, f + BEAT_F * 1.6, vel + 10)
        note(BASS, root + 7, f + BEAT_F * 2, f + BEAT_F * 3.6, vel + 6)
        if drums:
            for k in range(4):
                t = f + k * BEAT_F
                if t >= f1:
                    break
                note(DRUMS, 36 if k in (0, 2) else 37, t, t + 4, vel + (4 if k in (0, 2) else -6))
                note(DRUMS, 70, t + BEAT_F / 2, t + BEAT_F / 2 + 3, vel - 8)
                note(DRUMS, 70, t, t + 3, vel - 16)
        f += bar
        b += 1


def hit(at, chordv, root, dur, vel=96, cym=49):
    note(DRUMS, cym, at, at + 10, vel)
    note(DRUMS, 36, at, at + 4, vel + 10)
    chord(PAD, chordv, at, at + dur, vel - 40)
    note(BASS, root, at, at + dur, vel - 34)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {EP: 92, MAR: 92, BASS: 94, PAD: 64, GLOCK: 70, DRUMS: 72}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (EP, PAD, MAR, GLOCK):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=60)))

    groove(0, W(0, 9), ["F", "C"], 40)
    chord(PAD, CH["Dm"][1], W(0, 9), C(2), 34)
    note(BASS, 38, W(0, 9), C(2), 50)
    note(MAR, 74, W(1, 4), W(1, 4) + 12, 62)
    # myth: thin pentatonic for the 1965 pedometer
    pent = [72, 74, 77, 79, 81, 84]
    t = C(2)
    k = 0
    while t < W(4, 6) - 4:
        note(MAR, pent[(k * 3) % len(pent)], t, t + BEAT_F * 0.8, 50 + (8 if k % 4 == 0 else 0))
        t += BEAT_F
        k += 1
    chord(EP, [53, 60, 65], C(2), W(4, 6), 32)
    note(BASS, 41, W(2, 6) + 12, W(2, 6) + 30, 70)
    for p in [84, 81, 77]:
        note(MAR, p, W(3, 1) + (84 - p), W(3, 1) + 16, 58)
    hit(W(4, 6), [50, 57, 62], 26, C(5) - W(4, 6), 92, cym=55)
    # wipe -> REALITY
    for k in range(8):
        note(DRUMS, 51, C(5) - 16 + k * 2, C(5) - 15 + k * 2, 40 + k * 7)
    hit(C(5) + 4, [53, 57, 60, 65], 29, BEAT_F * 3, 100)
    t = W(5, 7)
    while t < C(6):
        note(BASS, 41, t, t + BEAT_F * 0.4, 44)
        t += BEAT_F / 2
    # curve: string riser into "forty-seven"
    h47 = W(7, 3)
    chord(PAD, [53, 60, 65], C(6), C(7), 44)
    note(BASS, 41, C(6), C(7), 44)
    for k, p in enumerate([60, 64, 65, 67, 69, 72]):
        note(PAD, p, C(7) + k * ((h47 - C(7)) / 6), h47, 34 + k * 7)
    hit(h47, [53, 57, 60, 65, 69], 29, C(8) - h47, 100)
    # flattens: soft resolve + kalimba sparkle on "modest"
    chord(PAD, [58, 62, 65], C(8), C(9), 34)
    note(BASS, 34, C(8), C(9), 46)
    for k, p in enumerate([84, 88, 91, 96]):
        note(MAR, p, W(8, 6) + k * 3, W(8, 6) + 28, 74)
    note(GLOCK, 81, W(8, 6), W(8, 6) + 20, 60)
    # payoff: bright groove
    groove(C(9), C(11), ["F", "Bb", "C", "F"], 44)
    note(DRUMS, 49, W(9, 5), W(9, 5) + 10, 84)
    # end: back to the hook groove (loop)
    groove(C(11), TOTAL, ["F", "C"], 40)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "h01-10k-steps.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
