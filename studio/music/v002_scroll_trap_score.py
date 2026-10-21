#!/usr/bin/env python3
"""Score for V002 v2 "Why you can't stop scrolling" (v002-scroll-trap). Original MIDI.

112 BPM, D minor, 39 s. A bed under Spark's voice: sparse while he talks, energy in the gaps.
Palette (new for v2): celesta + vibraphone + pizzicato strings + synth bass + side-stick/shaker kit,
choir pad for the counter. Sections are placed on the voice timeline (seconds from voice.ts):
  0.0-6.5   night hook     celesta music-box figure over a dark pad (Dm9)
  6.5-11.5  old web        pizzicato steps, calm (Bb, F) - "a chance to stop"
  11.5-16   infinite scroll the endless groove enters: running bass eighths, side stick, shaker
  16-25     pull/jackpot   vibraphone stabs on the pulls, hit + cymbal on "jackpot" (19.6 s)
  25-31.3   the estimate   kit out, choir pad + rising low pulse, hit on "lifetimes" (28.9 s), 3 hits on EVERY SINGLE DAY
  31.4-36   the fix        bright major lift (F C Bb) pizz + celesta
  36-39     loop           back to the night figure so the end meets the start
"""
import os

import mido

TPB = 480
BPM = 112
TPS = TPB * BPM / 60  # ticks per second
HERE = os.path.dirname(os.path.abspath(__file__))
CEL, VIB, PIZZ, BASS, PAD, CHOIR, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {CEL: 8, VIB: 11, PIZZ: 45, BASS: 38, PAD: 89, CHOIR: 52}
B = TPB  # one beat
events = []


def t(sec):
    return int(round(sec * TPS))


def note(ch, p, start, dur, vel):
    events.append((start, 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, vel)))))
    events.append((start + dur, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, start, dur, vel):
    for p in ps:
        note(ch, p, start, dur, vel)


def cc(ch, c, v, tick=0):
    events.append((tick, 0, mido.Message("control_change", channel=ch, control=c, value=v)))


def night(s0, s1, vel=50):
    """music-box figure D F A E over Dm9 pad, one figure per bar"""
    chord(PAD, [50, 53, 57, 64], t(s0), t(s1) - t(s0), 40)
    note(BASS, 38, t(s0), t(s1) - t(s0), 40)
    fig = [74, 77, 81, 76, 74, 72, 69, 72]
    k = t(s0)
    i = 0
    while k < t(s1) - B // 2:
        note(CEL, fig[i % 8], k, B, vel - (i % 4) * 4)
        k += B // 2 if i % 4 in (1, 2) else B
        i += 1


def groove(s0, s1, roots, vel=1.0, drums=True):
    k0, k1 = t(s0), t(s1)
    k = k0
    i = 0
    while k < k1:
        r = roots[(i // 8) % len(roots)]
        note(BASS, r + (12 if i % 8 == 7 else 0), k, B // 2 - 20, int((78 if i % 2 == 0 else 62) * vel))
        if drums:
            if i % 4 == 2:
                note(DRUMS, 37, k, B // 4, int(70 * vel))  # side stick on 2 and 4
            if i % 8 == 0:
                note(DRUMS, 36, k, B // 4, int(80 * vel))
            note(DRUMS, 70, k, B // 4, int((46 if i % 2 else 34) * vel))  # shaker eighths
        k += B // 2
        i += 1


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {CEL: 88, VIB: 92, PIZZ: 96, BASS: 96, PAD: 66, CHOIR: 78, DRUMS: 84}.items():
        cc(ch, 7, vol)
    for ch, pan in {CEL: 76, VIB: 50, PIZZ: 40}.items():
        cc(ch, 10, pan)
    for ch in (CEL, VIB, PIZZ, PAD, CHOIR):
        cc(ch, 91, 72)

    night(0.0, 6.4)
    # 2006 freeze: a held vib cluster on "2006" (5.5 s)
    chord(VIB, [62, 65, 69], t(5.5), t(1.0), 70)

    # old web: calm pizz steps Bb -> F
    for i, (r, v) in enumerate([(46, [58, 62, 65]), (41, [57, 60, 65])]):
        s = 6.5 + i * 2.5
        note(BASS, r, t(s), t(2.4), 52)
        for j in range(4):
            note(PIZZ, v[j % 3] + (12 if j == 3 else 0), t(s) + j * B, B // 2, 58)
    note(CEL, 81, t(11.0), B, 60)  # "stop" ding-ish

    # infinite scroll: the endless groove
    groove(11.6, 16.0, [38, 46, 41, 45])
    for s in (13.6, 15.0):
        chord(VIB, [62, 65, 69], t(s), B // 2, 60)

    # pull to refresh: lighter groove + vib stabs on pulls; jackpot hit
    groove(16.0, 19.5, [38, 38, 46, 45], vel=0.75)
    for s in (17.5, 18.7):
        chord(VIB, [57, 60], t(s), B // 2, 64)
    note(DRUMS, 49, t(19.6), B * 2, 100)
    note(DRUMS, 36, t(19.6), B // 2, 100)
    chord(VIB, [62, 65, 69, 74, 77], t(19.65), B * 2, 90)
    chord(PIZZ, [50, 57, 62, 65], t(19.65), B, 84)
    groove(20.4, 25.0, [46, 41, 45, 38], vel=0.7)
    note(CEL, 86, t(20.2), B, 70)  # "Random" aha sparkle
    note(CEL, 81, t(20.45), B, 60)

    # the estimate: drums out, choir pad, rising pulse
    chord(CHOIR, [50, 57, 62], t(25.1), t(3.8), 54)
    k = t(26.8)
    i = 0
    while k < t(28.85):
        note(BASS, 38 + (i // 4), k, B // 4, 60 + i * 2)
        k += B // 2
        i += 1
    note(DRUMS, 49, t(28.88), B * 2, 104)
    note(DRUMS, 36, t(28.88), B // 2, 110)
    chord(CHOIR, [46, 53, 58, 62], t(28.9), t(1.0), 70)
    for s, p in ((29.87, 38), (30.53, 41), (30.9, 34)):  # EVERY. SINGLE. DAY.
        note(DRUMS, 36, t(s), B // 2, 104)
        note(DRUMS, 38, t(s), B // 2, 80)
        note(BASS, p, t(s), B // 2, 92)
    note(DRUMS, 49, t(30.9), B * 2, 90)

    # the fix: bright major lift
    for i, (r, v) in enumerate([(41, [65, 69, 72]), (48, [64, 67, 72]), (46, [65, 70, 74])]):
        s = 31.4 + i * 1.5
        note(BASS, r, t(s), t(1.4), 70)
        for j in range(3):
            note(PIZZ, v[j], t(s) + j * (B // 2) * 2, B // 2, 68)
        note(CEL, v[2] + 12, t(s) + B, B // 2, 56)
    note(DRUMS, 70, t(31.4), B // 4, 40)
    groove(33.0, 35.8, [41, 48], vel=0.55)

    # loop back to night (matches the opening)
    night(35.9, 39.0, vel=46)

    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    last = 0
    for tick, _, msg in events:
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v002-scroll-trap.mid")
    mid.save(out)
    print("wrote", out)


if __name__ == "__main__":
    main()
