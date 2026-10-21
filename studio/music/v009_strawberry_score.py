#!/usr/bin/env python3
"""Score for V009 · POV: the smartest AI can't count the r's in strawberry.

Playful comedic bounce: pizzicato strings + marimba + woodblocks, 125 BPM, F major.
1 bar = 1.92 s. 12 bars ≈ 23 s (voice 22.5 s). Sparse under the voice, energy in the gaps.
  bar 0-1   hook "POV: the AI..."      pizz bass + woodblock tick-tock (quiet), cartoon "wrong" slide at bar 1.9
  bar 2-4   chunks / tokenizer          pizz chords on off-beats, marimba 3-note "brick" figure
  bar 5-6   x-ray reveal (wow)          glockenspiel shimmer + suspended chord
  bar 7-8   newer models / spell first  lighter, celesta answer
  bar 9-10  spelling S-T-R-A-W...       rising marimba ladder, one step per letter
  bar 11    "Three r's" hit + loop      crash + tonic, bounce figure that leads back to bar 0
"""
import os
import mido

TPB = 480
BAR = TPB * 4
E8, E16 = TPB // 2, TPB // 4
HERE = os.path.dirname(os.path.abspath(__file__))
PIZZ, MARIMBA, GLOCK, CELESTA, PAD, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {PIZZ: 45, MARIMBA: 12, GLOCK: 9, CELESTA: 8, PAD: 89}
events = []


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def cc(ch, c, v, t=0):
    events.append((t, 0, mido.Message("control_change", channel=ch, control=c, value=v)))


def bar(b):
    return int(b * BAR)


CH = {"F": (41, [53, 57, 60]), "Bb": (46, [53, 58, 62]), "C": (48, [55, 60, 64]), "Dm": (50, [53, 57, 62]), "Gm": (43, [55, 58, 62])}
PROG = ["F", "C", "Dm", "Bb", "F", "C", "Gm", "C", "F", "Bb", "C", "F"]


def bounce(b, name, soft=1.0, offchords=True):
    root, v = CH[name]
    s = bar(b)
    for k, off in enumerate([0, 2 * TPB]):  # pizz bass on 1 and 3, fifth on 3
        note(PIZZ, root + (7 if k else 0) - 12, s + off, E8, int(78 * soft))
    if offchords:
        for off in (TPB + E8, 3 * TPB + E8):
            for p in v:
                note(PIZZ, p, s + off, E16, int(46 * soft))
    for k in range(4):  # woodblock tick-tock
        note(DRUMS, 76 if k % 2 == 0 else 77, s + k * TPB, E16, int(44 * soft))


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {PIZZ: 100, MARIMBA: 96, GLOCK: 72, CELESTA: 80, PAD: 58, DRUMS: 84}.items():
        cc(ch, 7, vol)
    for ch in (MARIMBA, GLOCK, CELESTA, PAD):
        cc(ch, 91, 64)
    cc(GLOCK, 10, 84)
    cc(MARIMBA, 10, 46)

    # bars 0-1: hook
    bounce(0, "F", 0.8, offchords=False)
    bounce(1, "C", 0.8, offchords=False)
    for k, p in enumerate([72, 70, 67, 64, 60]):  # cartoon "wrong" descent in the gap after "two r's"
        note(MARIMBA, p, bar(1.75) + k * E16 // 2 * 1, E16, 70 - k * 4)
    # bars 2-4: bricks
    for i, b in enumerate([2, 3, 4]):
        bounce(b, PROG[b])
        root, v = CH[PROG[b]]
        for k, p in enumerate(v):  # three-brick figure on beat 4
            note(MARIMBA, p + 12, bar(b) + 3 * TPB + k * E16, E16, 74)
    # bars 5-6: x-ray shimmer
    for b in (5, 6):
        root, v = CH[PROG[b]]
        for p in v:
            note(PAD, p, bar(b), BAR, 50)
        note(PIZZ, root - 12, bar(b), E8, 70)
        for k in range(8):
            note(GLOCK, v[k % 3] + 24 + (5 if b == 6 and k > 4 else 0), bar(b) + k * E8, E8, 50 + (k % 3) * 6)
    # bars 7-8: newer models / spell first (lighter)
    for b in (7, 8):
        bounce(b, PROG[b], 0.75)
        root, v = CH[PROG[b]]
        note(CELESTA, v[2] + 12, bar(b) + 2 * TPB + E8, E8, 60)
        note(CELESTA, v[1] + 12, bar(b) + 3 * TPB, E8, 56)
    # bars 9-10: spelling ladder (one step per letter, ~0.33 s each)
    scale = [65, 67, 69, 70, 72, 74, 76, 77, 79, 81]
    t0 = bar(9) - E8
    step = int(0.33 / (60 / 125) * TPB)
    for k, p in enumerate(scale):
        note(MARIMBA, p, t0 + k * step, E8, 58 + k * 3)
        note(DRUMS, 76, t0 + k * step, E16, 40)
    for b in (9, 10):
        root, _ = CH[PROG[b]]
        note(PIZZ, root - 12, bar(b), E8, 66)
        note(PIZZ, root - 5, bar(b) + 2 * TPB, E8, 60)
    # bar 11: the hit + loop bounce back to F
    note(DRUMS, 49, bar(11), BAR, 96)
    note(DRUMS, 36, bar(11), E8, 100)
    for p in CH["F"][1] + [65, 69, 72]:
        note(PIZZ, p, bar(11), E8, 88)
        note(MARIMBA, p + 12, bar(11), TPB, 80)
    note(PIZZ, 29, bar(11), E8, 90)
    bounce(11.5, "F", 0.7, offchords=False)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(125), time=0))
    last = 0
    for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(m.copy(time=t - last))
        last = t
    out = os.path.join(HERE, "v009-strawberry.mid")
    mid.save(out)
    print(f"wrote {out} ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
