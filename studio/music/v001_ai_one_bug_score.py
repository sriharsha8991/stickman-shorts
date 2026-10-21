#!/usr/bin/env python3
"""Score for V001 v2 "POV: You asked AI to fix ONE bug" (v001-ai-one-bug).

Playful comedic bounce, 126 BPM, C major. Original MIDI; a sparse bed under Spark's voice.
Sections are placed on video frames taken from voice.ts so hits land on spoken words:
  f 0-147    hook + prompt      pizzicato off-beat bounce + marimba blips (light)
  f 147-350  AI "helps"         tuba oom-pah enters, woodblock ticks, rising pizz each bar (tension)
  f 350      collapse ("fails") timpani + crash + falling trombone
  f 350-493  aftermath          sparse, "wah-wah" trombone descent under "Still. There."
  f 493-566  the fix            bright marimba + glockenspiel sparkle on "not" (f 534)
  f 566-637  Every. Single. Time.  three stabs, then the opening bounce again (loop seam)
Writes v001-ai-one-bug.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

TPB = 480
BPM = 126
HERE = os.path.dirname(os.path.abspath(__file__))
PIZZ, MARIMBA, TUBA, GLOCK, TIMP, BONE, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {PIZZ: 45, MARIMBA: 12, TUBA: 58, GLOCK: 9, TIMP: 47, BONE: 57}
BEAT_F = 30 * 60 / BPM  # video frames per beat (~14.3)

events = []


def fr(frame):
    """video frame -> MIDI tick"""
    return int(round(frame / BEAT_F * TPB))


def note(ch, pitch, start, dur, vel):
    events.append((start, 1, mido.Message("note_on", channel=ch, note=pitch, velocity=max(1, min(127, vel)))))
    events.append((start + dur, 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def chord(ch, ps, start, dur, vel):
    for p in ps:
        note(ch, p, start, dur, vel)


E8 = TPB // 2
CH = {"C": (36, [60, 64, 67]), "G": (43, [59, 62, 67]), "Am": (45, [57, 60, 64]), "F": (41, [57, 60, 65]), "Dm": (38, [57, 62, 65])}
PROG = ["C", "G", "Am", "F"]


def bounce(t0, t1, vel=54, marimba=True):
    """light pizzicato off-beats + marimba blip on beat 1 of every other bar"""
    beat = 0
    t = t0
    while t < t1:
        name = PROG[(beat // 4) % 4]
        root, v = CH[name]
        if beat % 2 == 1:
            chord(PIZZ, v, t, E8, vel)
        if beat % 4 == 0:
            note(PIZZ, root + 12, t, E8, vel + 6)
            if marimba and (beat // 4) % 2 == 0:
                note(MARIMBA, v[-1] + 12, t + E8, E8, vel)
        t += TPB
        beat += 1


def build(t0, t1):
    """tuba oom-pah + woodblock; the pizz line climbs a step every bar (tension)"""
    beat = 0
    t = t0
    while t < t1:
        bar = beat // 4
        name = ["C", "Dm", "C", "Dm", "F", "G", "G"][min(bar, 6)]
        root, v = CH[name]
        if beat % 2 == 0:
            note(TUBA, root, t, E8, 70)
        else:
            chord(PIZZ, [p + bar for p in v], t, E8, 50 + bar * 3)
        note(DRUMS, 76 if beat % 2 == 0 else 77, t, E8 // 2, 46 + bar * 3)
        t += TPB
        beat += 1


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {PIZZ: 92, MARIMBA: 96, TUBA: 90, GLOCK: 78, TIMP: 80, BONE: 84, DRUMS: 88}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (PIZZ, MARIMBA, GLOCK, BONE):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=60)))

    bounce(0, fr(147))                                   # hook + prompt
    build(fr(147), fr(346))                              # AI arrives and stacks blocks
    # collapse on "fails" (f 350): timpani roll into a hit + crash + falling trombone
    for k in range(6):
        note(TIMP, 43, fr(338) + k * (TPB // 6), TPB // 6, 40 + k * 5)
    note(TIMP, 36, fr(350), TPB * 2, 66)
    note(DRUMS, 49, fr(350), TPB * 2, 80)
    for k, p in enumerate([60, 57, 53, 48]):
        note(BONE, p, fr(352) + k * E8, E8, 70 - k * 6)
    # aftermath: sparse tuba + pizz pulse
    t = fr(372)
    while t < fr(452):
        note(TUBA, 38, t, E8, 56)
        chord(PIZZ, [57, 62, 65], t + TPB, E8, 40)
        t += TPB * 2
    # "Still. There." wah-wah trombone descent
    for k, (p, at) in enumerate([(58, 452), (57, 462), (56, 472), (55, 482)]):
        note(BONE, p, fr(at), fr(at + 10) - fr(at) + (TPB if k == 3 else 0), 64)
    # the fix: bright marimba arps, glock sparkle on "not" (f 534)
    t = fr(493)
    i = 0
    while t < fr(562):
        name = ["F", "G", "C", "C"][(i // 8) % 4]
        _, v = CH[name]
        note(MARIMBA, (v + [v[0] + 12])[i % 4], t, E8, 54 + (i % 4) * 4)
        if i % 8 == 0:
            note(TUBA, CH[name][0], t, TPB, 60)
        t += E8
        i += 1
    for k, p in enumerate([84, 88, 91, 96]):
        note(GLOCK, p, fr(534) + k * (TPB // 4), TPB, 76)
    # Every. Single. Time.: three stabs
    for at, ps in [(566, [55, 60, 64]), (589, [57, 60, 65]), (601, [55, 59, 62, 67])]:
        chord(PIZZ, ps, fr(at), E8, 84)
        note(TUBA, ps[0] - 24, fr(at), E8, 80)
        note(DRUMS, 38, fr(at), E8, 70)
    # loop seam: the opening bounce again
    bounce(fr(613), fr(637), vel=50, marimba=False)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v001-ai-one-bug.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
