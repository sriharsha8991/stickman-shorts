#!/usr/bin/env python3
"""Score for V005 "POV: demo day" (v005-demo-day).

Nervous lounge comedy, 118 BPM swing, F major. Original MIDI: clarinet + celesta + brushed kit +
upright-ish bass; choir + organ for the "demo gods". Placed on video frames from voice.ts:
  f 0-151    rehearsal (2:55)   light swing: brush snare, walking bass, celesta chords, clarinet lick in gaps
  f 151-230  live (3:00)        tremolo strings pulse, ticking hi-hat (tension)
  f 230      "Frozen."          everything cuts (silence = the freeze)
  f 249      "Spinning."        celesta spinning arpeggio
  f 287-342  "demo gods"        choir + organ chord, timpani on "gods"
  f 342-434  demo ends/works    celesta glissando up on "works" (f 398), swing returns softly
  f 434-563  backup + next      swing bed, ends back on the opening chord (loop)
Writes v005-demo-day.mid next to this file.
"""
import os

import mido

TPB = 480
BPM = 118
HERE = os.path.dirname(os.path.abspath(__file__))
CLAR, CEL, BASS, STR, CHOIR, ORGAN, TIMP, DRUMS = 0, 1, 2, 3, 4, 5, 6, 9
PROGRAMS = {CLAR: 71, CEL: 8, BASS: 32, STR: 44, CHOIR: 52, ORGAN: 19, TIMP: 47}
BEAT_F = 30 * 60 / BPM
events = []


def fr(frame):
    return int(round(frame / BEAT_F * TPB))


def note(ch, p, start, dur, vel):
    events.append((start, 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, vel)))))
    events.append((start + dur, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, start, dur, vel):
    for p in ps:
        note(ch, p, start, dur, vel)


SW = int(TPB * 2 / 3)  # swung eighth
CH = {"F": (41, [65, 69, 72]), "Dm": (38, [62, 65, 69]), "Gm": (43, [62, 67, 70]), "C": (36, [64, 67, 70])}
PROG = ["F", "Dm", "Gm", "C"]


def swing(f0, f1, vel=38, lick=True):
    t = fr(f0)
    beat = 0
    while t < fr(f1):
        name = PROG[(beat // 4) % 4]
        root, v = CH[name]
        note(BASS, root + [0, 4, 7, 9][beat % 4] - 12 + 12, t, TPB - 40, vel + 6)  # walking bass
        note(DRUMS, 51, t, TPB // 4, vel - 6)  # ride
        note(DRUMS, 51, t + SW, TPB // 4, vel - 18)
        if beat % 2 == 1:
            note(DRUMS, 40, t, TPB // 4, vel - 14)  # brush-ish snare
        if beat % 4 == 0:
            chord(CEL, [p + 12 for p in v], t + SW, TPB // 2, vel - 8)
        t += TPB
        beat += 1


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {CLAR: 84, CEL: 90, BASS: 96, STR: 74, CHOIR: 84, ORGAN: 70, TIMP: 84, DRUMS: 80}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (CLAR, CEL, STR, CHOIR, ORGAN):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=60)))

    swing(0, 151)
    # clarinet licks in the small gaps (f 71-75, 146-151) - short and quiet
    for k, p in enumerate([72, 74, 77]):
        note(CLAR, p, fr(68) + k * (TPB // 3), TPB // 3, 50)
    for k, p in enumerate([77, 76, 74, 72]):
        note(CLAR, p, fr(140) + k * (TPB // 4), TPB // 4, 50)
    # live: tremolo strings + ticking hat
    chord(STR, [53, 56, 60], fr(151), fr(230) - fr(151), 50)
    t = fr(151)
    while t < fr(228):
        note(DRUMS, 42, t, TPB // 4, 46)
        t += TPB // 2
    note(BASS, 29, fr(151), fr(228) - fr(151), 54)
    # "Frozen." -> silence until "Spinning."
    t = fr(249)
    k = 0
    while t < fr(285):
        note(CEL, [72, 76, 79, 84, 79, 76][k % 6], t, TPB // 4, 52)
        t += TPB // 4
        k += 1
    # demo gods: choir + organ, timpani on "gods" (f 304)
    chord(CHOIR, [50, 53, 57, 62], fr(287), fr(342) - fr(287), 92)
    chord(ORGAN, [38, 50, 53, 57], fr(287), fr(342) - fr(287), 56)
    note(TIMP, 38, fr(304), TPB * 2, 110)
    # demo ends: soft swing, celesta glissando on "works" (f 398)
    swing(352, 434, vel=32)
    for k, p in enumerate([72, 74, 76, 77, 79, 81, 84, 86, 88, 89]):
        note(CEL, p, fr(398) + k * (TPB // 8), TPB // 2, 60)
    # backup + next
    swing(434, 552, vel=36)
    chord(CEL, [77, 81, 84], fr(546), TPB, 50)  # back to the opening F (loop)
    note(BASS, 41, fr(546), TPB, 50)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v005-demo-day.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
