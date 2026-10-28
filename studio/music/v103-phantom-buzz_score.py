#!/usr/bin/env python3
"""Score for V103 "Your pocket buzzed. Your phone didn't." (20 s).

G major, 96 BPM (1 beat = 0.625 s). Placed in seconds so hits land on the spoken words:
  0.0-7.0   metro carriage: muted-guitar plucks (G - Em - C - D), brushed kit, vibraphone "ping" motif
  7.0-14.8  sonar room: kit out, low pad + sub pulse, sonar pings (high vib with echo) on the sweep;
            0.5 s drop before CALL! (10.7 s) then a low hit; second smaller hit on TEXT! (12.3 s)
  14.8-20   back in the carriage: plucks return brighter, celesta resolve on "most" (16.4 s), ping motif for the loop
Writes v103-phantom-buzz.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

TPB = 480
BPM = 96
TPS = TPB * BPM / 60  # ticks per second
HERE = os.path.dirname(os.path.abspath(__file__))

GTR, VIB, PAD, BASS, CEL, SUB, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {GTR: 28, VIB: 11, PAD: 89, BASS: 33, CEL: 8, SUB: 38}
events = []


def t(sec):
    return int(round(sec * TPS))


def note(ch, pitch, s, d, vel):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def cc(ch, c, v, s=0.0):
    events.append((t(s), 0, mido.Message("control_change", channel=ch, control=c, value=v)))


BEAT = 60 / BPM
CH = {"G": (43, [55, 59, 62]), "Em": (40, [52, 55, 59]), "C": (48, [52, 55, 60]), "D": (50, [54, 57, 62])}


def pluck_bar(s0, name, vel=56, bright=False):
    root, v = CH[name]
    for k in range(8):  # eighth-note muted plucks, sparse pattern
        if k in (0, 3, 4, 6):
            p = v[k % 3] + (12 if bright and k == 6 else 0)
            note(GTR, p, s0 + k * BEAT / 2, BEAT / 2 * 0.8, vel - (k % 2) * 8)
    note(BASS, root, s0, BEAT * 1.8, 58)
    note(BASS, root + 7, s0 + 2 * BEAT, BEAT * 1.6, 50)


def brushes(s0, soft=1.0):
    for b in range(4):
        note(DRUMS, 42, s0 + b * BEAT, 0.1, int(34 * soft))
        note(DRUMS, 42, s0 + b * BEAT + BEAT / 2, 0.1, int(24 * soft))
    note(DRUMS, 36, s0, 0.2, int(52 * soft))
    note(DRUMS, 38, s0 + BEAT, 0.15, int(30 * soft))
    note(DRUMS, 38, s0 + 3 * BEAT, 0.15, int(30 * soft))


def ping(s, pitch=86, vel=58, echoes=2):
    note(VIB, pitch, s, 0.9, vel)
    for e in range(1, echoes + 1):
        note(VIB, pitch, s + e * 0.42, 0.7, max(12, vel - 22 * e))


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {GTR: 88, VIB: 80, PAD: 70, BASS: 92, CEL: 78, SUB: 84, DRUMS: 80}.items():
        cc(ch, 7, vol)
    for ch, pan in {GTR: 46, VIB: 82, CEL: 74}.items():
        cc(ch, 10, pan)
    for ch in (VIB, PAD, CEL, GTR):
        cc(ch, 91, 72)

    bar = 4 * BEAT  # 2.5 s
    # carriage 0-7.0 s
    for i, name in enumerate(["G", "Em", "C"]):
        s0 = i * bar
        if s0 >= 7.0:
            break
        pluck_bar(s0, name, vel=50 if i == 0 else 56)
        brushes(s0, soft=0.7 if i == 0 else 1.0)
    ping(0.0, 86, 60)
    ping(4.7, 83, 50, 1)
    # sonar room 7.0-14.8 s
    for k, name in enumerate(["Em", "C", "D"]):
        s0 = 7.0 + k * bar
        r, v = CH[name]
        if s0 + bar > 10.2 and s0 < 10.7:
            note(PAD, v[0] - 12, s0, 10.2 - s0, 42)
        elif s0 < 14.8:
            note(PAD, v[0] - 12, s0, min(bar, 14.8 - s0), 42)
            note(PAD, v[2] - 12, s0, min(bar, 14.8 - s0), 36)
    for s in (7.1, 8.35, 9.6):  # sonar pings on the sweep (stop for the 0.5 s drop)
        ping(s, 91, 52, 2)
    for s in [7.0 + j * BEAT for j in range(5)]:  # sub pulse
        note(SUB, 40, s, BEAT * 0.5, 46)
    # CALL! hit at 10.7 s
    note(SUB, 31, 10.7, 1.2, 96)
    note(DRUMS, 49, 10.7, 1.0, 70)
    note(DRUMS, 36, 10.7, 0.3, 90)
    note(PAD, 52 - 12, 10.7, 1.6, 50)
    # TEXT! hit at 12.33 s
    note(SUB, 36, 12.33, 0.8, 80)
    note(DRUMS, 55, 12.33, 0.8, 52)
    ping(12.4, 93, 50, 1)
    note(PAD, 47, 12.9, 1.9, 38)
    note(PAD, 50, 12.9, 1.9, 34)
    # back in the carriage 14.8-20 s
    for i, name in enumerate(["C", "D"]):
        s0 = 14.8 + i * bar
        pluck_bar(s0, name, vel=58, bright=True)
        brushes(s0, soft=0.9)
    for k, p in enumerate([67, 71, 74, 79]):  # celesta resolve on "most"
        note(CEL, p, 16.37 + k * 0.12, 1.2, 62 - k * 4)
    ping(19.3, 86, 54, 1)  # motif returns for the loop

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v103-phantom-buzz.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
