#!/usr/bin/env python3
"""Score for H27 "You can't catch up on sleep at the weekend" (h27-weekend-sleep-debt).

112 BPM, 4/4 -> 1 bar = 2.143 s (~64.3 frames). 18 bars = 38.6 s (rendered to the voice length).
Mood (row): curious -> build -> reveal, lo-fi keys + marimba. Palette: Rhodes, vibraphone, marimba,
upright bass, brushed/soft kit, warm pad. Different world from V013 (no pizz/clav/brass, major-7 colours).
  bars 0-1   hook / myth      Rhodes Fmaj7 Em7, lazy swung hats (curious)
  bars 2-4   lab + lie-in     marimba plinks join, soft kick (build)
  bars 5-6   Monday + NOPE    drop to Dm7 / Bbmaj7, vibes only, thud into bar 7
  bars 7-9   insulin reveal   pulse + rising marimba, crash on the -27% (bar 9.35)
  bars 10-13 snack/clock/yoyo light groove, marimba answers in the gaps
  bars 14-16 steady window    warm major Fmaj7 C Bbmaj7, pad, gentle kit
  bar  17    loop             = bar 0
"""
import os

import mido

TPB = 480
BAR = TPB * 4
E8, E16 = TPB // 2, TPB // 4
HERE = os.path.dirname(os.path.abspath(__file__))
RHODES, VIBES, MARIMBA, BASS, PAD, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {RHODES: 4, VIBES: 11, MARIMBA: 12, BASS: 32, PAD: 88}
events = []


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, v)))))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


def bar(b):
    return b * BAR


SW = 40  # swing offset for off-beats
CH = {"Fmaj7": (41, [57, 60, 64, 65]), "Em7": (40, [55, 59, 62, 64]), "Dm7": (38, [53, 57, 60, 62]),
      "Bbmaj7": (46, [53, 57, 58, 62]), "C": (48, [55, 60, 64, 67]), "Am7": (45, [55, 57, 60, 64])}


def keys(b, name, v=54):
    root, vs = CH[name]
    s = bar(b)
    chord(RHODES, vs, s, TPB * 3, v)
    chord(RHODES, vs[1:], s + 3 * TPB + E8 + SW, E8, v - 12)
    note(BASS, root - 12, s, TPB * 2, 66)
    note(BASS, root - 5, s + 2 * TPB + E8 + SW, E8, 54)


def hats(b, v=34):
    s = bar(b)
    for k in range(8):
        note(DRUMS, 42, s + k * E8 + (SW if k % 2 else 0), E16, v if k % 2 == 0 else v - 10)


def kit(b, soft=0.6, crash=False):
    s = bar(b)
    if crash:
        note(DRUMS, 49, s, TPB, int(90 * soft))
    note(DRUMS, 36, s, E8, int(100 * soft))
    note(DRUMS, 36, s + 2 * TPB + E8 + SW, E8, int(80 * soft))
    note(DRUMS, 37, s + TPB, E8, int(70 * soft))  # side stick
    note(DRUMS, 37, s + 3 * TPB, E8, int(70 * soft))
    hats(b, int(50 * soft))


def plinks(b, name, up=False, v=60):
    _, vs = CH[name]
    s = bar(b)
    for k, off in enumerate([E8 + SW, 2 * TPB + SW, 3 * TPB + E8 + SW]):
        note(MARIMBA, vs[(k + (1 if up else 0)) % len(vs)] + 12, s + off, E8, v - k * 4)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {RHODES: 94, VIBES: 80, MARIMBA: 92, BASS: 100, PAD: 70, DRUMS: 84}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (RHODES, VIBES, MARIMBA, PAD):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=72)))

    for i, name in enumerate(["Fmaj7", "Em7"]):
        keys(i, name)
        hats(i)
    for i, name in enumerate(["Fmaj7", "Em7", "Dm7"]):
        keys(2 + i, name)
        plinks(2 + i, name)
        kit(2 + i, soft=0.45)
    for i, name in enumerate(["Dm7", "Bbmaj7"]):
        s = bar(5 + i)
        chord(VIBES, CH[name][1], s, BAR, 46)
        note(BASS, CH[name][0] - 12, s, BAR, 62)
    note(DRUMS, 36, bar(7) - TPB, TPB, 90)  # thud into NOPE
    for i, name in enumerate(["Am7", "Dm7", "Em7"]):
        b = 7 + i
        keys(b, name, v=48)
        for k in range(8):
            note(MARIMBA, CH[name][1][k % 4] + 12 + (k // 4) * 2 + i * 2, bar(b) + k * E8, E16, 40 + k * 3 + i * 6)
        for k in range(4):
            note(DRUMS, 36, bar(b) + k * TPB, E8, 44 + i * 8)
    note(DRUMS, 49, bar(9) + int(0.35 * BAR), TPB * 2, 100)  # -27% hit
    note(DRUMS, 36, bar(9) + int(0.35 * BAR), TPB, 112)
    for i, name in enumerate(["Fmaj7", "Em7", "Dm7", "Em7"]):
        keys(10 + i, name, v=50)
        plinks(10 + i, name, up=(i % 2 == 1), v=56)
        kit(10 + i, soft=0.5)
    for i, name in enumerate(["Fmaj7", "C", "Bbmaj7"]):
        b = 14 + i
        keys(b, name, v=56)
        chord(PAD, [p - 12 for p in CH[name][1]], bar(b), BAR, 40)
        plinks(b, name, up=True, v=62)
        kit(b, soft=0.55, crash=(i == 0))
    keys(17, "Fmaj7")
    hats(17)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(112), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "h27-weekend-sleep-debt.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
