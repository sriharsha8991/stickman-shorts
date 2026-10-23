#!/usr/bin/env python3
"""Score for V013 v2 re-cut (retention v2, 30 s) of "AI won't take your job..." (v013-ai-wont-take-job-v2).

Same palette as v1 (it's the same video, re-cut), re-timed to the new beat sheet:
  0.93 s     charge power-up peak: crash + kick on the -19 crash (tremolo riser from frame 0)
  bars 0-1   hook pizz ostinato · bars 2-3 light groove (faster) · bars 4-8 tension (trick task 12.3 s,
  "two in three" hit 17.6 s) · bar 9 E7 riser into "polished" 20.3 s · bars 10-12 release (checking 23.1 s)
  · bar 13 = hook bar (loop, "Because the next report..." 27.6 s)
Original v1 notes:

115 BPM, 4/4 -> 1 bar = 2.087 s (~62.6 frames). 19 bars = 39.7 s (rendered to the voice length).
Mood (plan): tension in minor, bright major release on the reality. Palette: pizzicato strings, clav,
synth bass, tight drums, brass stabs only on the release. Sparse under the voice.
  bars 0-1   hook          pizz ostinato in A minor, ticking hats, no kick (tension)
  bar  2     half true     stab + bass drop
  bars 3-6   the win       light groove Am C F G, clav on 2 & 4
  bars 7-10  trick task    drums out, tremolo strings Dm E, riser into the -19 hit (bar 8.6)
  bars 11-12 polished      snare build on E7
  bars 13-17 checking      major release C G Am F, soft brass stabs, full but quiet drums
  bar  18    loop          = bar 0
"""
import os

import mido

TPB = 480
BAR = TPB * 4
E8, E16 = TPB // 2, TPB // 4
HERE = os.path.dirname(os.path.abspath(__file__))
PIZZ, CLAV, BASS, STR, BRASS, PAD, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {PIZZ: 45, CLAV: 7, BASS: 38, STR: 49, BRASS: 61, PAD: 89}
events = []


def note(ch, p, s, d, v):
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, v)))))
    events.append((s + d, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


def bar(b):
    return b * BAR


CH = {"Am": (45, [57, 60, 64]), "C": (48, [55, 60, 64]), "F": (41, [53, 57, 60]), "G": (43, [55, 59, 62]),
      "Dm": (50, [53, 57, 62]), "E": (40, [56, 59, 64]), "E7": (40, [56, 59, 62, 64])}


def hook_bar(b):
    s = bar(b)
    for k, p in enumerate([57, 64, 60, 64, 57, 65, 60, 64]):
        note(PIZZ, p, s + k * E8, E8, 70 if k % 4 == 0 else 52)
    note(BASS, 33, s, BAR - E8, 58)
    for k in range(8):
        note(DRUMS, 42, s + k * E8, E16, 40 if k % 2 else 30)


def drums(b, soft=0.7, crash=False, fill=False):
    s = bar(b)
    if crash:
        note(DRUMS, 49, s, TPB, int(96 * soft))
    for beat in range(4):
        t = s + beat * TPB
        if beat in (0, 2):
            note(DRUMS, 36, t, E8, int(104 * soft))
        if beat in (1, 3):
            note(DRUMS, 38, t, E8, int(84 * soft))
        note(DRUMS, 42, t, E16, int(60 * soft))
        note(DRUMS, 42, t + E8, E16, int(44 * soft))
    if fill:
        for k in range(4):
            note(DRUMS, 38, s + 3 * TPB + k * E16, E16, int((70 + k * 10) * soft))


def groove(b, name, bright=False):
    root, v = CH[name]
    s = bar(b)
    for k in (0, 3, 4, 6):
        note(BASS, root - 12 + (12 if k == 6 else 0), s + k * E8, E8, 84)
    chord(CLAV, v, s + TPB, E16, 58)
    chord(CLAV, v, s + 3 * TPB, E16, 54)
    note(PIZZ, v[0] + 12, s, E8, 50)
    note(PIZZ, v[2] + 12, s + 2 * TPB + E8, E8, 46)
    if bright:
        chord(PAD, [p - 12 for p in v], s, BAR, 36)


def tension(b, name, riser=False):
    root, v = CH[name]
    s = bar(b)
    for k in range(16):  # tremolo strings
        chord(STR, v, s + k * E16, E16, 34 + (k * 2 if riser else 0))
    note(BASS, root - 12, s, BAR, 64)
    for k in range(4):
        note(DRUMS, 36, s + k * TPB, E8, 50 if k == 0 else 34)
    if riser:
        for k in range(8):
            note(DRUMS, 38, s + 2 * TPB + k * E16, E16, 40 + k * 7)


def release(b, name, stab=True, crash=False):
    root, v = CH[name]
    s = bar(b)
    for k in (0, 3, 4, 6):
        note(BASS, root - 12, s + k * E8, E8, 88)
    chord(PAD, [p - 12 for p in v], s, BAR, 42)
    if stab:
        chord(BRASS, [p + 12 for p in v], s, E8, 66)
        chord(BRASS, [p + 12 for p in v], s + 2 * TPB + E8, E16, 54)
    chord(CLAV, v, s + TPB, E16, 52)
    chord(CLAV, v, s + 3 * TPB, E16, 50)
    drums(b, soft=0.75, crash=crash)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {PIZZ: 96, CLAV: 84, BASS: 100, STR: 88, BRASS: 82, PAD: 70, DRUMS: 90}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (PIZZ, STR, BRASS, PAD):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=64)))

    SPB = 60 / 115 * 4

    def sec(t):
        return int(t / SPB * BAR)

    for k in range(12):  # charge rumble into the cold-open hit
        chord(STR, [57, 64], k * E16 // 2, E16 // 2, 40 + k * 5)
    hook_bar(0)
    hook_bar(1)
    h = sec(0.93)
    note(DRUMS, 49, h, TPB * 2, 104)
    note(DRUMS, 36, h, E8, 112)
    chord(BRASS, [45, 52, 57], h, TPB, 84)
    note(BASS, 33, h, BAR, 72)
    for i, name in enumerate(["C", "F"]):
        groove(2 + i, name, bright=True)
        drums(2 + i, soft=0.5, fill=(i == 1))
    tension(4, "Dm")
    tension(5, "E")
    note(DRUMS, 49, sec(12.33), TPB, 80)
    note(DRUMS, 36, sec(12.33), E8, 96)
    tension(6, "Dm")
    tension(7, "E", riser=True)
    tension(8, "E", riser=True)
    note(DRUMS, 49, sec(17.6), TPB, 96)
    note(DRUMS, 36, sec(17.6), TPB, 110)
    tension(9, "E7", riser=True)
    note(DRUMS, 49, sec(20.33), TPB, 92)
    chord(BRASS, [52, 56, 59], sec(20.33), E8, 70)
    for i, name in enumerate(["C", "G", "Am"]):
        release(10 + i, name, stab=(i != 1), crash=(i == 1))
    hook_bar(13)
    hook_bar(14)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(115), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v013-ai-wont-take-job-v2.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
