#!/usr/bin/env python3
"""Score for H05 "Does your standing desk protect your heart?" (h05-standing-still).

Morning-office bed, A major, 116 BPM, sparse under the voice (different from V019's E minor pizzicato classroom):
muted guitar off-beat chops + finger bass + soft brushes; clavinet stabs only in the gaps; the study build adds a
16th-note shaker and a rising bass; a half-second DROP (silence) right before the reveal at 20.73 s, then a
vibraphone + low piano hit with a crash and calm sustained chords while the two hearts beat; the MOVE part brings a
brighter walking bass + claps; the last two bars repeat the opening so the Short loops into frame 0.
Times are written in seconds (anchored to the voice cues in voice.ts) and converted to ticks.
Writes h05-standing-still.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

BPM = 116
TPB = 480
SEC = TPB * BPM / 60  # ticks per second
BEAT = 60 / BPM
HERE = os.path.dirname(os.path.abspath(__file__))

GTR, BASS, CLAV, VIBES, PAD, PIANO, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {GTR: 28, BASS: 33, CLAV: 7, VIBES: 11, PAD: 89, PIANO: 0}

REVEAL = 20.73  # "People who stood more..." (cue 6 start)
DROP = REVEAL - 0.55
MOVE = 24.63  # cue 7
END = 35.0

events = []


def t(s):
    return int(round(s * SEC))


def note(ch, pitch, start_s, dur_s, vel):
    a, b = t(start_s), t(start_s + dur_s)
    events.append((a, 1, mido.Message("note_on", channel=ch, note=pitch, velocity=max(1, min(127, vel)))))
    events.append((b, 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


CH = {
    "A": (45, [57, 61, 64]),
    "F#m": (42, [54, 57, 61]),
    "D": (38, [54, 57, 62]),
    "E": (40, [56, 59, 64]),
    "Bm": (47, [54, 59, 62]),
    "C#m": (49, [56, 61, 64]),
}
BAR = 4 * BEAT


def office_bar(s0, name, clav=False, hats=True):
    """Muted-guitar off-beat chops, finger bass on 1 and the 'and' of 2, soft brush hats."""
    root, v = CH[name]
    for k in range(4):
        chord(GTR, v, s0 + k * BEAT + BEAT / 2, BEAT * 0.22, 46)
    note(BASS, root, s0, BEAT * 0.9, 62)
    note(BASS, root + 7, s0 + 1.5 * BEAT, BEAT * 0.45, 48)
    note(BASS, root, s0 + 2 * BEAT, BEAT * 0.9, 56)
    if hats:
        for k in range(4):
            note(DRUMS, 42, s0 + k * BEAT, 0.08, 34)
        note(DRUMS, 37, s0 + 3 * BEAT, 0.08, 30)  # side-stick
    if clav:
        note(CLAV, v[2] + 12, s0 + 3.5 * BEAT, BEAT * 0.3, 44)


def study_bar(s0, name, k):
    """The build: same chops, 16th shaker, bass climbing a step each bar."""
    root, v = CH[name]
    for b in range(4):
        chord(GTR, v, s0 + b * BEAT + BEAT / 2, BEAT * 0.22, 44 + k * 2)
    for i in range(16):
        note(DRUMS, 70, s0 + i * BEAT / 4, 0.05, 22 + (i % 4 == 0) * 10 + k * 2)  # maracas
    for b in range(4):
        note(BASS, root + (0, 2, 4, 7)[b], s0 + b * BEAT, BEAT * 0.8, 52 + k * 3)
    note(DRUMS, 36, s0, 0.1, 40 + k * 4)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {GTR: 84, BASS: 100, CLAV: 74, VIBES: 96, PAD: 66, PIANO: 90, DRUMS: 82}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch, pan in {GTR: 46, CLAV: 82, VIBES: 64}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=10, value=pan)))
    for ch in (GTR, VIBES, PAD, PIANO, CLAV):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=60)))

    # 0 - ~13.4 s: morning office (hook, promise, desk, statue)
    prog = ["A", "F#m", "D", "E"]
    s = 0.0
    i = 0
    while s + BAR <= 13.4 + 0.01:
        office_bar(s, prog[i % 4], clav=(i % 2 == 1), hats=(i > 0))
        s += BAR
        i += 1
    # 13.4 s -> drop: the study build (Bm D E E)
    k = 0
    for name in ["Bm", "D", "E", "E"]:
        if s >= DROP:
            break
        study_bar(s, name, k)
        s += BAR
        k += 1
    # remove everything that would sound inside the drop (silence before the reveal)
    events[:] = [e for e in events if not (t(DROP - 0.35) <= e[0] < t(REVEAL) and e[2].type == "note_on")]
    # close notes still ringing at the drop
    # REVEAL hit + calm sustained chords while the hearts beat
    note(DRUMS, 49, REVEAL, 1.2, 64)
    note(PIANO, 33, REVEAL, 2.4, 70)
    chord(VIBES, [57, 61, 66], REVEAL, 1.9, 66)  # F#m
    chord(PAD, [54, 57, 61], REVEAL, 2.0, 40)
    chord(VIBES, [57, 62, 66], REVEAL + 2.0, 1.9, 60)  # D
    chord(PAD, [54, 57, 62], REVEAL + 2.0, MOVE - REVEAL - 2.0, 38)
    note(BASS, 42, REVEAL, 1.9, 54)
    note(BASS, 38, REVEAL + 2.0, MOVE - REVEAL - 2.0, 50)
    # heartbeat on the low piano (two soft thumps per beat pair) under the hearts
    hb = REVEAL + 0.2
    while hb < MOVE - 0.4:
        note(PIANO, 33, hb, 0.12, 40)
        note(PIANO, 33, hb + 0.22, 0.12, 30)
        hb += 2 * BEAT
    # MOVE -> question: brighter walking groove with claps
    s = MOVE
    for j, name in enumerate(["A", "E", "F#m", "D", "A"]):
        if s + BAR > END - 2 * BAR + 0.1:
            break
        root, v = CH[name]
        for b in range(4):
            chord(GTR, v, s + b * BEAT + BEAT / 2, BEAT * 0.22, 48)
            note(BASS, root + (0, 4, 7, 9)[b], s + b * BEAT, BEAT * 0.8, 60)
            note(DRUMS, 42, s + b * BEAT, 0.08, 36)
        note(DRUMS, 39, s + BEAT, 0.08, 34)
        note(DRUMS, 39, s + 3 * BEAT, 0.08, 34)
        note(VIBES, v[2] + 12, s + 3.5 * BEAT, BEAT * 0.5, 40)
        s += BAR
    # loop tail: the opening bars again so the end flows into frame 0
    loop0 = END - 2 * BAR
    office_bar(loop0, "A", hats=False)
    office_bar(loop0 + BAR, "F#m", clav=True, hats=True)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "h05-standing-still.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
