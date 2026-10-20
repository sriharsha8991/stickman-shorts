#!/usr/bin/env python3
"""Score for "Why you can't stop scrolling" (scroll-trap).

120 BPM, 4/4 -> 1 bar = 2 s = 60 video frames at 30 fps. 18 bars = 36 s.
Sections follow the storyboard so every scene starts on a bar line:
  bars 0-1   S1 night hook     Rhodes + warm pad, Am7 / Fmaj7 (quiet, lo-fi)
  bars 2-5   S2 infinite scroll groove enters: drums, bass, marimba riff (Am F C G)
  bars 6-9   S3 slot machine   groove + glockenspiel arps, crash on reveal (bar 7) and jackpot (bar 9)
  bars 10-12 S4 regret         drums out, strings + low piano (Dm Am E) - tension
  bars 13-15 S5 the fix        bright major groove (C G F)
  bars 16-17 S6 loop           same as bars 0-1 so the video loops seamlessly
Writes scroll-trap.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))

# channels
RHODES, PAD, MARIMBA, BASS, GLOCK, STRINGS, PIANO, DRUMS = 0, 1, 2, 3, 4, 5, 6, 9
PROGRAMS = {RHODES: 4, PAD: 89, MARIMBA: 12, BASS: 33, GLOCK: 9, STRINGS: 48, PIANO: 0}

events = []  # (tick, order, msg) ; order: 0 = note_off before note_on at same tick


def note(ch, pitch, start, dur, vel):
    events.append((start, 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((start + dur, 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def chord(ch, pitches, start, dur, vel):
    for p in pitches:
        note(ch, p, start, dur, vel)


def cc(ch, control, value, tick):
    events.append((tick, 0, mido.Message("control_change", channel=ch, control=control, value=value)))


def bar(b):
    return b * BAR


E8 = TPB // 2
E16 = TPB // 4

# chord tones (MIDI) per name: (bass root, voicing)
CH = {
    "Am7": (45, [57, 60, 64, 67]),
    "Fmaj7": (41, [53, 57, 60, 64]),
    "Am": (45, [57, 60, 64]),
    "F": (41, [53, 57, 60]),
    "C": (48, [55, 60, 64]),
    "G": (43, [55, 59, 62]),
    "Dm": (50, [53, 57, 62]),
    "E": (40, [56, 59, 64]),
}


def night(b0):
    """Two quiet bars: Rhodes Am7 -> Fmaj7 with a slow broken-chord lilt, warm pad underneath."""
    for i, name in enumerate(["Am7", "Fmaj7"]):
        root, v = CH[name]
        s = bar(b0 + i)
        chord(PAD, [p - 12 for p in v[:3]], s, BAR, 46)
        # broken chord on Rhodes: 1, &2, 3, &4
        for k, off in enumerate([0, TPB + E8, 2 * TPB, 3 * TPB + E8]):
            note(RHODES, v[k % len(v)] + (12 if k == 3 else 0), s + off, TPB * 2, 58 - k * 3)
        note(BASS, root, s, BAR - E8, 50)


def drums(b, fill=False, crash=False, soft=False):
    s = bar(b)
    v = 0.7 if soft else 1.0
    if crash:
        note(DRUMS, 49, s, TPB, int(100 * v))
    for beat in range(4):
        t = s + beat * TPB
        if beat in (0, 2):
            note(DRUMS, 36, t, E8, int(108 * v))
        if beat in (1, 3):
            note(DRUMS, 38, t, E8, int(92 * v))
            note(DRUMS, 39, t, E8, int(60 * v))
        note(DRUMS, 42, t, E16, int(70 * v))
        note(DRUMS, 42, t + E8, E16, int(52 * v))
    note(DRUMS, 36, s + 2 * TPB + E8 + E16, E16, int(80 * v))  # syncopated kick
    if fill:
        for k in range(4):
            note(DRUMS, 38, s + 3 * TPB + k * E16, E16, 70 + k * 10)


def groove_bar(b, name, riff_up=False):
    root, v = CH[name]
    s = bar(b)
    # bass: root eighths with an octave pop on the "and" of 4
    for k in range(8):
        p = root + (12 if k == 7 else 0)
        note(BASS, p, s + k * E8, E8 - 30, 88 if k % 2 == 0 else 70)
    # marimba riff: syncopated chord-tone pattern
    pattern = [0, 2, 1, None, 2, 0, 1, 2]
    for k, idx in enumerate(pattern):
        if idx is None:
            continue
        p = v[idx] + (12 if riff_up else 0)
        note(MARIMBA, p, s + k * E8, E8, 84 if k in (0, 3, 6) else 66)
    # Rhodes comp on 2 and 4
    chord(RHODES, v, s + TPB, E8, 52)
    chord(RHODES, v, s + 3 * TPB, E8, 48)


def glock_arp(b, name):
    _, v = CH[name]
    s = bar(b)
    seq = (v + [v[0] + 12]) * 4
    for k in range(16):
        note(GLOCK, seq[k] + 12, s + k * E16, E16, 58 + (k % 4) * 6)


def regret_bar(b, name, last=False):
    root, v = CH[name]
    s = bar(b)
    chord(STRINGS, v, s, BAR, 70 if not last else 84)
    note(STRINGS, root, s, BAR, 64)
    for k in range(4):  # low heartbeat piano
        note(PIANO, root - 12, s + k * TPB, E8, 72 if k == 0 else 50)
    if last:  # rising tension into the counter hit
        for k, p in enumerate([v[0] + 12, v[1] + 12, v[2] + 12, v[0] + 24]):
            note(GLOCK, p, s + 2 * TPB + k * E8, E8, 70)


def main():
    # program changes + mix
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {RHODES: 92, PAD: 70, MARIMBA: 96, BASS: 100, GLOCK: 70, STRINGS: 86, PIANO: 84, DRUMS: 92}.items():
        cc(ch, 7, vol, 0)
    for ch, pan in {MARIMBA: 52, GLOCK: 80, RHODES: 48, STRINGS: 64}.items():
        cc(ch, 10, pan, 0)
    for ch in (RHODES, PAD, STRINGS, MARIMBA, GLOCK):
        cc(ch, 91, 70, 0)  # reverb send

    night(0)                                                  # bars 0-1
    for i, name in enumerate(["Am", "F", "C", "G"]):          # bars 2-5
        groove_bar(2 + i, name)
        drums(2 + i, crash=(i == 0), fill=(i == 3), soft=(i == 0))
    for i, name in enumerate(["Am", "F", "C", "G"]):          # bars 6-9
        groove_bar(6 + i, name, riff_up=(i >= 1))
        drums(6 + i, crash=(i in (1, 3)), fill=(i == 2))
        if i >= 1:
            glock_arp(6 + i, name)
    for i, name in enumerate(["Dm", "Am", "E"]):              # bars 10-12
        regret_bar(10 + i, name, last=(i == 2))
    for i, name in enumerate(["C", "G", "F"]):                # bars 13-15
        groove_bar(13 + i, name, riff_up=True)
        drums(13 + i, crash=(i == 0), fill=(i == 2))
        chord(PAD, [p - 12 for p in CH[name][1]], bar(13 + i), BAR, 40)
    night(16)                                                 # bars 16-17 (loop back to bar 0)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(120), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "scroll-trap.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
