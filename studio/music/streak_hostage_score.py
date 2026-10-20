#!/usr/bin/env python3
"""Score for "Your streak is a hostage" (V003, streak-hostage). Original composition.

120 BPM, 4/4 -> 1 bar = 2 s = 60 video frames at 30 fps. 18 bars = 36 s. D minor -> F major.
Sections follow the storyboard (every scene starts on a bar line):
  bars 0-1   S1 hook       driving synth-bass pulse + pizzicato offbeats + clock woodblock (tense)
  bars 2-4   S2 origin     light pizz + glock "day 1", then the pulse builds; crash on the flip (bar 4 beat 2)
  bars 5-6   S3 tease      rising riser: 16th bass climbing, string tremolo, timpani + snare roll crescendo
  bars 7-8   S3 BIG HIT    bar 7 downbeat = the "2x" (frame 420): orchestra hit + timpani + crash, brass stabs
  bars 9-11  S4 twist      drums out, sneaky music box + pizz bass, sparkle on the freeze
  bars 12-15 S5 payoff     warm F major: pad, piano, soft groove, brighter after the unclip (bar 14)
  bars 16-17 S6 loop       calm bar, then the hook pulse returns so the end loops into bar 0
Writes streak-hostage.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

TPB = 480
BAR = TPB * 4
E8 = TPB // 2
E16 = TPB // 4
HERE = os.path.dirname(os.path.abspath(__file__))

SYNB, PIZZ, TREM, BRASS, TIMP, HIT, MBOX, PAD, PIANO, GLOCK, DRUMS = 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 9
PROGRAMS = {SYNB: 38, PIZZ: 45, TREM: 44, BRASS: 61, TIMP: 47, HIT: 55, MBOX: 10, PAD: 89, PIANO: 0, GLOCK: 9}

events = []


def note(ch, pitch, start, dur, vel):
    vel = max(1, min(127, int(vel)))
    events.append((start, 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((start + dur, 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def chord(ch, pitches, start, dur, vel):
    for p in pitches:
        note(ch, p, start, dur, vel)


def cc(ch, control, value, tick):
    events.append((tick, 0, mido.Message("control_change", channel=ch, control=control, value=value)))


def bar(b):
    return b * BAR


CH = {  # (bass root, voicing)
    "Dm": (38, [62, 65, 69]),
    "Bb": (34, [58, 62, 65]),
    "C": (36, [60, 64, 67]),
    "A": (33, [61, 64, 69]),
    "Gm": (43, [62, 67, 70]),
    "F": (41, [60, 65, 69]),
    "Am": (45, [60, 64, 69]),
}


def hook_bar(b, name, soft=False):
    """Tense pulse: synth bass eighths, pizz offbeats, kick 1 & 3, clock woodblock on every beat."""
    root, v = CH[name]
    s = bar(b)
    k = 0.75 if soft else 1.0
    for i in range(8):
        note(SYNB, root + (12 if i in (3, 7) else 0), s + i * E8, E8 - 40, (96 if i % 2 == 0 else 78) * k)
        if i % 2 == 1:
            chord(PIZZ, v, s + i * E8, E8, 70 * k)
    for beat in range(4):
        note(DRUMS, 76 if beat % 2 == 0 else 77, s + beat * TPB, E16, 70 * k)  # wood block tick-tock
        note(DRUMS, 42, s + beat * TPB + E8, E16, 50 * k)
    note(DRUMS, 36, s, E8, 104 * k)
    note(DRUMS, 36, s + 2 * TPB, E8, 98 * k)
    note(DRUMS, 38, s + 3 * TPB + E8, E16, 60 * k)


def day_one(b):
    """Light and playful: pizz bounce + glock motif."""
    s = bar(b)
    for i, p in enumerate([62, 69, 66, 69, 62, 69, 67, 66]):
        note(PIZZ, p, s + i * E8, E8, 76 if i % 2 == 0 else 60)
    note(PIZZ, 38, s, TPB, 70)
    note(PIZZ, 45, s + 2 * TPB, TPB, 64)
    for i, p in enumerate([86, 90, 93]):
        note(GLOCK, p, s + i * E8 + TPB * 3 // 2, E8, 64)


def build_bar(b, name, crash_beat=None):
    root, v = CH[name]
    s = bar(b)
    for i in range(16):
        note(SYNB, root + (12 if i % 4 == 2 else 0), s + i * E16, E16 - 20, 70 + i * 2)
    for beat in range(4):
        note(DRUMS, 36, s + beat * TPB, E8, 100)
        note(DRUMS, 42, s + beat * TPB + E8, E16, 60)
    chord(TREM, v, s, BAR, 60)
    if crash_beat is not None:
        t = s + crash_beat * TPB
        note(DRUMS, 49, t, TPB, 112)
        note(TIMP, root, t, TPB, 110)
        chord(BRASS, v, t, E8 + E16, 100)


def riser_bar(b, name, k):
    """k = 0 (first tease bar) or 1 (second): everything climbs, but stays under the bar-7 hit."""
    root, v = CH[name]
    g = 0.72 if k else 0.85
    s = bar(b)
    for i in range(16):
        p = root + (i // 2) + 8 * k
        note(SYNB, p, s + i * E16, E16 - 20, (64 + 2 * i + 8 * k) * g)
    for i in range(4):
        chord(TREM, [p + i + 4 * k for p in v], s + i * TPB, TPB, (50 + 8 * i + 6 * k) * g)
    # timpani roll + snare roll crescendo
    step = E16 if k == 0 else E16 // 2
    n = BAR // step
    for i in range(n):
        note(TIMP, root, s + i * step, step, (36 + 44 * (i / n) + 8 * k) * g)
        if k == 1 or i % 2 == 0:
            note(DRUMS, 38, s + i * step, step, (30 + 50 * (i / n) + 8 * k) * g)
    note(DRUMS, 36, s, E8, 90)
    note(DRUMS, 36, s + 2 * TPB, E8, 90)


def big_bar(b, name, first=False):
    """Half-time heavy groove with brass stabs; `first` = the 2x hit."""
    root, v = CH[name]
    s = bar(b)
    if first:
        chord(HIT, [50, 57, 62, 65], s, TPB, 120)
        note(TIMP, 38, s, TPB * 2, 127)
        note(DRUMS, 49, s, TPB * 2, 127)
        note(DRUMS, 57, s, TPB * 2, 110)
    note(DRUMS, 36, s, E8, 116)
    note(DRUMS, 38, s + 2 * TPB, E8, 112)
    note(DRUMS, 36, s + 3 * TPB + E8, E8, 96)
    for beat in range(4):
        note(DRUMS, 42, s + beat * TPB, E16, 66)
        note(DRUMS, 42, s + beat * TPB + E8, E16, 50)
    note(SYNB, root, s, TPB * 2 - 40, 112)
    note(SYNB, root, s + 2 * TPB + E8, E8, 96)
    note(SYNB, root + 12, s + 3 * TPB, TPB - 40, 96)
    for t in (0, TPB + E8, 3 * TPB):
        chord(BRASS, v, s + t, E8 + E16, 104 if t == 0 else 88)
    chord(TREM, [p - 12 for p in v] + v, s, BAR, 92 if first else 64)


def sneaky_bar(b, name, motif, sparkle_beat=None):
    """Music-box tiptoe melody over pizz bass; no drums."""
    root, v = CH[name]
    s = bar(b)
    for i, p in enumerate(motif):
        if p:
            note(MBOX, p, s + i * E8, E8, 82)
    for beat in range(4):
        note(PIZZ, root + 12 if beat % 2 else root + 12 + 7, s + beat * TPB, E8, 72)
    note(DRUMS, 75, s + TPB, E16, 50)  # claves
    note(DRUMS, 75, s + 3 * TPB, E16, 50)
    chord(PAD, [p - 12 for p in v], s, BAR, 36)
    if sparkle_beat is not None:
        t = s + int(sparkle_beat * TPB)
        for i, p in enumerate([86, 89, 93, 98, 101]):
            note(GLOCK, p, t + i * (E16 // 2), E8, 80)
        note(DRUMS, 49, t, TPB, 70)


def warm_bar(b, name, drums=True, bright=False):
    root, v = CH[name]
    s = bar(b)
    chord(PAD, [p - 12 for p in v], s, BAR, 54)
    note(SYNB, root, s, TPB + E8, 78)
    note(SYNB, root + 7, s + TPB + E8, E8, 66)
    note(SYNB, root + 12, s + 2 * TPB, TPB, 70)
    note(SYNB, root, s + 3 * TPB, TPB, 66)
    for i, off in enumerate([0, E8, TPB, TPB + E8, 2 * TPB, 2 * TPB + E8, 3 * TPB, 3 * TPB + E8]):
        note(PIANO, v[i % 3] + (12 if bright and i % 4 == 3 else 0), s + off, E8, 70 - (i % 2) * 12)
    if drums:
        note(DRUMS, 36, s, E8, 86)
        note(DRUMS, 36, s + 2 * TPB + E8, E8, 70)
        note(DRUMS, 39, s + TPB, E8, 70)
        note(DRUMS, 39, s + 3 * TPB, E8, 70)
        for beat in range(4):
            note(DRUMS, 42, s + beat * TPB + E8, E16, 46)
    if bright:
        for i, p in enumerate([81, 84, 86, 89]):
            note(GLOCK, p, s + i * TPB, E8, 56)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    mix = {SYNB: 100, PIZZ: 90, TREM: 80, BRASS: 92, TIMP: 100, HIT: 96, MBOX: 96, PAD: 72, PIANO: 86, GLOCK: 70, DRUMS: 96}
    for ch, vol in mix.items():
        cc(ch, 7, vol, 0)
    for ch, pan in {PIZZ: 44, TREM: 70, BRASS: 58, MBOX: 74, PIANO: 56, GLOCK: 84}.items():
        cc(ch, 10, pan, 0)
    for ch in (TREM, PAD, MBOX, PIANO, GLOCK, BRASS):
        cc(ch, 91, 64, 0)

    hook_bar(0, "Dm")                               # bars 0-1
    hook_bar(1, "Bb")
    day_one(2)                                      # bars 2-4
    build_bar(3, "Dm")
    build_bar(4, "Bb", crash_beat=1)                # flip: frame 255 = bar 4 beat 1 (0-indexed beat 1 = 2nd beat)
    riser_bar(5, "Dm", 0)                           # bars 5-6
    riser_bar(6, "A", 1)
    big_bar(7, "Dm", first=True)                    # bar 7 downbeat = "2x"
    big_bar(8, "Bb")
    motif1 = [74, None, 77, 76, 74, None, 73, None]
    motif2 = [74, 77, 81, None, 80, 77, 76, None]
    sneaky_bar(9, "Dm", motif1)                     # bars 9-11
    sneaky_bar(10, "Gm", motif2, sparkle_beat=3.5)  # freeze ~ frame 652
    sneaky_bar(11, "A", [73, None, 76, None, 79, 76, 73, None])
    warm_bar(12, "F", drums=False)                  # bars 12-15
    warm_bar(13, "C")
    warm_bar(14, "Dm", bright=True)                 # unclip at frame 852 (bar 14)
    warm_bar(15, "Bb", bright=True)
    warm_bar(16, "F", drums=False)                  # bar 16 calm
    hook_bar(17, "Dm", soft=True)                   # bar 17 -> loops into bar 0

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(120), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "streak-hostage.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
