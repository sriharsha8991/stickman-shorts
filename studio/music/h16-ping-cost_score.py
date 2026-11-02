#!/usr/bin/env python3
"""Score for H16 "Does one ping really cost you 23 minutes?" (h16-ping-cost).

Light office-jazz bed, Bb major, 104 BPM, sparse under the voice (different from V023's C-major piano/harp storybook):
desk (0-16.2 s): soft vibraphone chords + walking upright bass with space, a ticking wood block like a wall clock;
test room (16.9-22.5 s): pizzicato + a muted trumpet answer in the gaps, the stopwatch tick doubles; a ~0.55 s DROP
(silence) before cue 7 at 23.53 s; "finished" (24.63 s): bright major lift with a glockenspiel ding; "But" (28.37 s):
low strings + rising timpani roll in G minor; the reveal hit on "stress" (29.43 s): full brass stab + timpani + cymbal,
held and fading through the pause; back at the desk (32.0 s): the opening vibraphone returns, calmer, so it loops.
Writes h16-ping-cost.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

BPM = 104
TPB = 480
SEC = TPB * BPM / 60
BEAT = 60 / BPM
BAR = 4 * BEAT
HERE = os.path.dirname(os.path.abspath(__file__))

VIB, BASS, PIZZ, TPT, STR, BRASS, GLOCK, TIMP, DRUMS = 0, 1, 2, 3, 4, 5, 6, 7, 9
PROGRAMS = {VIB: 11, BASS: 32, PIZZ: 45, TPT: 59, STR: 48, BRASS: 61, GLOCK: 9, TIMP: 47}

ROOM = 16.3  # the run to the test room
DROP = 22.98
REVEAL = 23.53  # cue 7
FIN = 24.63  # "finished"
BUT = 28.37  # cue 9
HIT = 29.43  # "stress"
BACK = 32.0  # cue 10
END = 37.95

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
    "Bb": (34, [62, 65, 70]),
    "Gm": (31, [62, 67, 70]),
    "Eb": (39, [63, 67, 70]),
    "F": (29, [60, 65, 69]),
    "Cm": (36, [60, 63, 67]),
}


def desk_bar(s0, name, soft=0):
    root, v = CH[name]
    chord(VIB, v, s0, BEAT * 1.8, 42 - soft)
    chord(VIB, v, s0 + 2.5 * BEAT, BEAT * 1.2, 32 - soft)
    note(BASS, root, s0, BEAT * 0.9, 58 - soft)
    note(BASS, root + 7, s0 + 2 * BEAT, BEAT * 0.9, 50 - soft)
    for k in range(4):
        note(DRUMS, 76, s0 + k * BEAT, 0.08, 26 - soft // 2)


def room_bar(s0, name):
    root, v = CH[name]
    note(BASS, root, s0, BEAT * 0.8, 56)
    note(BASS, root + 12, s0 + 2 * BEAT, BEAT * 0.8, 46)
    for k in (1, 3):
        note(PIZZ, v[0], s0 + k * BEAT, BEAT * 0.3, 46)
        note(PIZZ, v[2], s0 + k * BEAT, BEAT * 0.3, 42)
    chord(STR, [p - 12 for p in v], s0, BAR * 0.98, 24)
    for k in range(8):
        note(DRUMS, 76, s0 + k * BEAT / 2, 0.06, 26 + 3 * (k % 2 == 0))


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {VIB: 96, BASS: 100, PIZZ: 84, TPT: 76, STR: 88, BRASS: 104, GLOCK: 80, TIMP: 104, DRUMS: 66}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch, pan in {PIZZ: 40, TPT: 84, GLOCK: 76}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=10, value=pan)))
    for ch in (VIB, STR, TPT, BRASS, GLOCK):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=62)))

    prog = ["Bb", "Gm", "Eb", "F"]
    s, i = 0.0, 0
    while s + BAR <= ROOM + 0.05:
        desk_bar(s, prog[i % 4])
        s += BAR
        i += 1
    # small vibraphone answers in the gaps after the promise and after "something else"
    for st, ps in [(6.65, [70, 72, 74]), (9.2, [77, 74]), (16.2, [74, 77, 82])]:
        for j, p in enumerate(ps):
            note(VIB, p, st + j * BEAT / 2, BEAT / 2, 42)

    s = ROOM
    for name in ["Eb", "Cm", "F", "F"]:
        if s >= DROP:
            break
        room_bar(s, name)
        s += BAR
    # muted trumpet in the gap before "Only one group"
    for j, p in enumerate([72, 70, 74]):
        note(TPT, p, 19.7 + j * 0.2, 0.24, 46)

    # DROP: silence before the reveal
    events[:] = [e for e in events if not (t(DROP) <= e[0] < t(REVEAL) and e[2].type == "note_on")]
    events[:] = [e for e in events if not (e[0] >= t(REVEAL) and e[2].type == "note_on")]

    # "finished faster": bright lift + ding
    chord(VIB, [65, 70, 74], REVEAL, BAR * 0.5, 34)
    note(BASS, 34, REVEAL, BEAT, 44)
    for k in range(int((FIN - REVEAL) / (BEAT / 2))):
        note(DRUMS, 76, REVEAL + k * BEAT / 2, 0.06, 26)
    for j, p in enumerate([82, 86, 89]):
        note(GLOCK, p, FIN + j * 0.09, 0.5, 58)
    chord(BRASS, [58, 62, 65], FIN, BEAT * 1.2, 38)
    s = FIN + BEAT * 2
    for name in ["Bb", "F"]:
        desk_bar(s, name, soft=2)
        s += BAR
    # "But": low strings + timpani roll in G minor
    chord(STR, [43, 50, 55, 58], BUT, HIT - BUT, 52)
    r = BUT
    while r < HIT:
        k = (r - BUT) / (HIT - BUT)
        note(TIMP, 43, r, 0.09, int(30 + 50 * k))
        r += 0.09
    # the hit on "stress", held and fading through the pause
    chord(BRASS, [43, 50, 55, 58, 62, 67], HIT, 1.0, 96)
    chord(STR, [43, 50, 55, 58, 62, 67], HIT, BACK - HIT - 0.1, 62)
    note(TIMP, 31, HIT, 1.0, 104)
    note(DRUMS, 49, HIT, 1.2, 74)
    note(DRUMS, 36, HIT, 0.3, 78)
    # back at the desk: the opening returns, calmer
    s = BACK
    i = 0
    while s < END - 0.2:
        desk_bar(s, prog[i % 4], soft=6)
        s += BAR
        i += 1

    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    mid.save(os.path.join(HERE, "h16-ping-cost.mid"))


if __name__ == "__main__":
    main()
