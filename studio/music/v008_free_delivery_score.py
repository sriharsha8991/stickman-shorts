#!/usr/bin/env python3
"""Score for V008 "You paid ₹150 to save ₹40" (v008-free-delivery).

Bright shop-floor funk, 120 BPM, D major. Original MIDI: clavinet stabs, synth bass, vibraphone,
new-age pad, kit with claps. Number Reveal shape, placed on spoken words from voice.ts:
  hook (0)            clav stabs D / Bm + claps, vib "ka-ching" on "hundred"
  rewind (1-2)        descending vib run, then a thin 8th-note bass pulse (rising pulse)
  padding cart (3)    vib note per item landing, full chord hit on "unlocked"
  zero price (4)      groove G / A
  receipt (5-9)       pulse + pad only (sparse under the voice), tag blips
  number (10)         pad + snare riser from "jumped", hit on "sixty-nine"
  twist (11)          drop to bass + pad, hit on the flip ("priciest")
  fix (12-13)         bright groove G A D, ends on the hook stab (loop)
Writes v008-free-delivery.mid next to this file.
"""
import json
import os
import re

import mido

TPB = 480
BPM = 120
HERE = os.path.dirname(os.path.abspath(__file__))
EP, MAR, BASS, PAD, GLOCK, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {EP: 7, MAR: 11, BASS: 38, PAD: 88, GLOCK: 11}
BEAT_F = 30 * 60 / BPM
events = []

voice = open(os.path.join(HERE, "..", "src", "v008-free-delivery", "voice.ts")).read()
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
    "D": (50, [62, 66, 69]),
    "Bm": (47, [59, 62, 66]),
    "G": (43, [59, 62, 67]),
    "A": (45, [61, 64, 69]),
    "Em": (52, [59, 64, 67]),
}


def groove(f0, f1, prog, vel=44, drums=True):
    bar = BEAT_F * 4
    f = f0
    b = 0
    while f < f1 - 4:
        root, v = CH[prog[b % len(prog)]]
        for k in (0, 1.5, 2.5):  # funky stabs
            t = f + k * BEAT_F
            if t < f1:
                chord(EP, v, t, t + BEAT_F * 0.4, vel)
        note(BASS, root - 12, f, f + BEAT_F * 0.8, vel + 12)
        note(BASS, root, f + BEAT_F * 1.5, f + BEAT_F * 1.9, vel + 6)
        note(BASS, root - 12, f + BEAT_F * 3, f + BEAT_F * 3.6, vel + 8)
        if drums:
            for k in range(4):
                t = f + k * BEAT_F
                if t >= f1:
                    break
                note(DRUMS, 36 if k in (0, 2) else 39, t, t + 4, vel + (10 if k in (0, 2) else 2))
                note(DRUMS, 42, t + BEAT_F / 2, t + BEAT_F / 2 + 3, vel - 12)
        f += bar
        b += 1


def pulse(f0, f1, p, vel=44):
    t = f0
    k = 0
    while t < f1 - 2:
        note(BASS, p, t, t + BEAT_F * 0.35, vel + (6 if k % 2 == 0 else 0))
        t += BEAT_F / 2
        k += 1


def hit(at, chordv, root, dur, vel=96):
    note(DRUMS, 49, at, at + 10, vel)
    note(DRUMS, 36, at, at + 4, vel + 10)
    chord(EP, chordv, at, at + dur, vel - 30)
    note(BASS, root - 12, at, at + dur, vel - 30)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {EP: 84, MAR: 90, BASS: 96, PAD: 66, GLOCK: 80, DRUMS: 78}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (EP, PAD, MAR):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=50)))

    groove(0, W(1, 0), ["D", "Bm"], 40)
    for k, p in enumerate([86, 90, 93]):
        note(MAR, p, W(0, 3) + k * 2, W(0, 3) + 20, 70)
    # rewind: descending vib
    for k, p in enumerate([93, 90, 86, 81, 78, 74]):
        note(MAR, p, W(1, 0) + k * 2, W(1, 0) + k * 2 + 6, 62)
    pulse(W(1, 0) + 12, C(3), 38, 40)
    chord(PAD, [62, 66, 69], W(1, 0) + 12, C(3), 34)
    note(MAR, 78, W(2, 2), W(2, 2) + 14, 64)
    # padding the cart
    L = [W(3, 3) + 12, W(3, 4) + 12, W(3, 6) + 12]
    pulse(C(3), L[2], 38, 44)
    for k, t in enumerate(L):
        note(MAR, [81, 85, 88][k], t, t + 10, 70)
    hit(L[2], [62, 66, 69, 74], 50, BEAT_F * 2, 98)
    groove(L[2] + BEAT_F * 2, C(5), ["G", "A"], 42)
    # receipt: sparse pulse + pad
    chord(PAD, [59, 62, 66], C(5), W(10, 2), 34)
    pulse(C(5), W(10, 2), 35, 34)
    for t in (W(5, 6), W(6, 3), W(9, 4)):
        note(MAR, 86, t, t + 8, 60)
    # number riser -> hit on sixty-nine
    h69 = W(10, 6)
    for k, p in enumerate([62, 66, 69, 71, 74, 78]):
        note(PAD, p, W(10, 2) + k * ((h69 - W(10, 2)) / 6), h69, 34 + k * 7)
    t = W(10, 2)
    k = 0
    while t < h69 - 1:
        note(DRUMS, 38, t, t + 2, 30 + k * 4)
        t += BEAT_F / 4
        k += 1
    hit(h69, [62, 66, 69, 74], 50, C(11) - h69, 104)
    # twist: bass + pad, hit on the flip
    chord(PAD, [52, 59, 64], C(11), W(11, 3), 38)
    note(BASS, 40, C(11), W(11, 3), 56)
    hit(W(11, 3), [59, 64, 67, 71], 52, BEAT_F * 2, 100)
    for k, p in enumerate([83, 86, 91, 95]):
        note(MAR, p, W(11, 3) + 2 + k * 2, W(11, 3) + 30, 72)
    # fix: bright groove, ends on the hook stab
    groove(C(12), TOTAL - BEAT_F, ["G", "A", "D", "D"], 40)
    chord(EP, CH["D"][1], TOTAL - BEAT_F, TOTAL, 46)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v008-free-delivery.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
