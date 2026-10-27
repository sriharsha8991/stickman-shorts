#!/usr/bin/env python3
"""Score for V025 · Why do you finish movies you hate? (Your brain did this, 25.4 s).

Late-night cinema lounge-noir in A minor, 84 BPM (1 beat = 0.714 s). Sparse under the voice:
  0.0–5.2 s   sulky: upright bass walk Am–Dm–E7–Am, soft ride + side-stick, one vibraphone sigh per bar
  5.6–7.0 s   "money is gone": four descending vibraphone notes (the coins flying away)
  10.1 s      "wasting" (SUNK COST): low Rhodes minor stab
  11.0–17.4 s the theatre study: lighter, C major–G–Am–F, celesta plucks + side-stick (curious)
  17.6–18.5 s DROP to near-silence before the rip
  18.5 s      rip: hit; 19.6 s "Your brain is.": bright A major chord + glock (the aha)
  20.5–25.4 s warm A major bed thinning out, last bar returns to the opening Am figure so the loop cuts clean
Writes v025-paid-to-stay.mid next to this file. Render with tools/render_midi.py.
"""
import os
import mido

TPB = 480
BPM = 84
TPS = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
VIBES, BASS, RHODES, CELESTA, GLOCK, PAD, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {VIBES: 11, BASS: 32, RHODES: 4, CELESTA: 8, GLOCK: 9, PAD: 89}
events = []
B = 60 / BPM


def t(sec):
    return int(round(sec * TPS))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {VIBES: 86, BASS: 92, RHODES: 70, CELESTA: 80, GLOCK: 84, PAD: 56, DRUMS: 70}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (VIBES, RHODES, CELESTA, GLOCK, PAD):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=70)))

    # 0–5.7 s: sulky walk (2 beats per chord)
    walk = [(45, [57, 60, 64]), (50, [57, 62, 65]), (52, [56, 59, 62]), (45, [57, 60, 64])]
    s = 0.0
    for root, c in walk:
        note(BASS, root, s, B * 0.9, 64)
        note(BASS, root + 7, s + B, B * 0.8, 54)
        note(DRUMS, 51, s, 0.2, 34)
        note(DRUMS, 51, s + B, 0.2, 28)
        note(DRUMS, 37, s + B, 0.1, 30)
        note(VIBES, c[2] + 12, s + B * 0.5, B * 1.2, 40)  # one sigh
        s += 2 * B
    # 5.6–7.0 s: coins flying away
    for k, p in enumerate([88, 84, 81, 76]):
        note(VIBES, p, 5.65 + k * 0.14, 0.4, 48 - k * 3)
    note(BASS, 45, 6.2, 1.2, 50)
    # 7.2–10 s: low and slow (staying can't bring it back)
    for k, (root, c) in enumerate([(50, [57, 62, 65]), (52, [56, 59, 62])]):
        st = 7.25 + k * 1.43
        note(BASS, root, st, 1.2, 52)
        for p in c:
            note(RHODES, p, st, 1.3, 34)
        note(DRUMS, 51, st, 0.2, 26)
    # 10.1 s: SUNK COST stab
    for p in [45, 57, 60, 64]:
        note(RHODES if p > 50 else BASS, p, 10.1, 0.8, 66)
    note(DRUMS, 41, 10.12, 0.2, 70)
    # 11.0–17.4 s: the theatre study (lighter, curious)
    prog = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]
    s = 11.0
    for j in range(4):
        root, c = prog[j]
        note(BASS, root, s, B * 0.8, 56)
        note(BASS, root + 7, s + B, B * 0.6, 46)
        for k, i in enumerate([0, 2, 1, 2]):
            note(CELESTA, c[i] + 12, s + k * B * 0.5, 0.2, 46 if k == 0 else 38)
        note(DRUMS, 37, s + B, 0.1, 34)
        note(DRUMS, 42, s + B * 0.5, 0.1, 22)
        note(DRUMS, 42, s + B * 1.5, 0.1, 22)
        s += 2 * B
    note(GLOCK, 84, 15.07, 0.4, 56)  # "more plays"
    # 17.6–18.5 s: drop (nothing), 18.5 s rip hit
    R = 18.53
    note(DRUMS, 49, R, 1.0, 84)
    note(DRUMS, 36, R, 0.2, 90)
    note(BASS, 45, R, 0.5, 70)
    # 19.6 s: the aha (A major)
    A = 19.6
    for k, p in enumerate([76, 81, 85, 88]):
        note(GLOCK, p, A + k * 0.09, 0.5, 86 - k * 4)
    for p in [57, 61, 64, 69]:
        note(PAD, p, A, 2.4, 62)
    note(BASS, 45, A, 1.0, 70)
    # 20.6–24.0 s: warm bed, thinning out
    s = 20.6
    for j, (root, c) in enumerate([(50, [62, 66, 69]), (45, [61, 64, 69]), (52, [56, 59, 64])]):
        v = 48 - j * 4
        note(BASS, root, s, B * 0.9, v + 6)
        note(VIBES, c[1] + 12, s + B * 0.5, B, v - 6)
        note(DRUMS, 51, s, 0.2, 24)
        s += 2 * B * 0.8
    # last bar: the opening Am figure (loop)
    note(BASS, 45, 24.6, B * 0.9, 56)
    note(DRUMS, 51, 24.6, 0.2, 30)
    note(VIBES, 76, 24.6 + B * 0.5, 0.4, 38)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v025-paid-to-stay.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
