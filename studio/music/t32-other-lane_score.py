#!/usr/bin/env python3
"""Score for T32 "Why does your lane lose the race to lane 2?" (t32-other-lane). Spark Got Tricked #7.

Rush-hour car-radio tune in F major, 108 BPM: electric piano, fingered bass, soft closed hi-hat, clean guitar chops
(different from T11's accordion, T26's bossa, T17's tuba, T36's guitar ballad, T37's music box).
A horn-like stab when Mr. Trick drives past, vibraphone when the screen switches on, the bed thins to slow low steps
while the cars crawl past YOU, half a second of silence, timpani + brass + glockenspiel on "them!", a fast vibraphone
run while YOU passes, the biggest chord on Spark's mindblown, and back to the frame-0 groove so it loops.
"""
import os
import mido

BPM = 108
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
EP, BS, GT, VB, BR, TI, GL, DR = 0, 1, 2, 3, 4, 5, 6, 9
PROGRAMS = {EP: 4, BS: 33, GT: 27, VB: 11, BR: 61, TI: 47, GL: 9}
FPS = 30
TRICK, SIM, PAUSE, SLOW, DROP, HIT, FAST, QUICK, BIG, Q, BACK, END = [x / FPS for x in (240, 373, 488, 529, 596, 611, 658, 712, 728, 766, 800, 854)]
events = []


def t(s):
    return int(round(s * SEC))


def note(ch, p, s, d, v):
    events.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


BEAT = 60 / BPM
# F - Dm - Bb - C
CHANGES = [(41, [57, 60, 65]), (38, [57, 62, 65]), (46, [58, 62, 65]), (36, [55, 60, 64])]


def bed(a, b, vel=44, comp=34, hat=True, guitar=True):
    """bass on 1 and the and-of-2, soft e-piano on 2 and 4, guitar chops, closed hi-hat on the off-beats"""
    s, i = a, 0
    while s < b - 0.3:
        root, ch = CHANGES[i % 4]
        note(BS, root, s, 0.7 * BEAT, vel)
        if s + 1.5 * BEAT < b - 0.1:
            note(BS, root + 12, s + 1.5 * BEAT, 0.4 * BEAT, vel - 10)
        if s + 2.5 * BEAT < b - 0.1:
            note(BS, root + 7, s + 2.5 * BEAT, 0.6 * BEAT, vel - 6)
        for off in [1, 3]:
            at = s + off * BEAT
            if at < b - 0.1:
                chord(EP, ch, at, 0.5 * BEAT, comp)
                if guitar:
                    chord(GT, [p + 12 for p in ch], at + 0.5 * BEAT, 0.15 * BEAT, comp - 8)
        if hat:
            for h in range(8):
                at = s + h * 0.5 * BEAT
                if at < b - 0.05:
                    note(DR, 42, at, 0.1, 22 if h % 2 else 14)
        s += 4 * BEAT
        i += 1


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    # frame 0: a car horn-like stab and the groove starts
    chord(BR, [53, 57, 60], 0.05, 0.25, 50)
    bed(0.05, TRICK - 0.2)
    # Mr. Trick drives past: a cheeky two-note brass call
    note(BR, 65, TRICK, 0.2, 58)
    note(BR, 72, TRICK + 0.28, 0.35, 62)
    bed(TRICK + 0.7, SIM - 0.1, vel=40, comp=30)
    # the screen switches on: vibraphone arpeggio, then a lighter bed (no hats)
    for i, p in enumerate([65, 69, 72, 77]):
        note(VB, p, SIM + i * 0.12, 0.6, 46)
    bed(SIM + 0.6, PAUSE, vel=38, comp=28, hat=False)
    # the pause: one held low note
    note(BS, 41, PAUSE, SLOW - PAUSE, 34)
    # the cars crawl past YOU: slow low steps on the bass + a soft tick
    for i in range(int((DROP - SLOW) / BEAT)):
        at = SLOW + i * BEAT
        note(BS, [41, 43, 45, 46, 48][i % 5], at, 0.8 * BEAT, 40 + i * 2)
        note(DR, 37, at + 0.5 * BEAT, 0.1, 18)
    # DROP: half a second of nothing, HIT: "them!"
    note(TI, 41, HIT, 0.4, 100)
    note(TI, 48, HIT + 0.18, 0.5, 90)
    chord(BR, [41, 48, 53, 57, 60], HIT, 0.9, 80)
    for i, p in enumerate([77, 81, 84]):
        note(GL, p, HIT + i * 0.1, 0.5, 72)
    # YOU passes quickly: a fast vibraphone run
    for i, p in enumerate([60, 62, 65, 67, 69, 72, 74, 77, 79, 81, 84, 86]):
        note(VB, p, FAST + 0.2 + i * (QUICK - FAST - 0.3) / 12, 0.25, 44 + i * 2)
    # the biggest moment: both bars, Spark mindblown
    note(TI, 41, BIG, 0.35, 104)
    note(TI, 48, BIG + 0.2, 0.5, 92)
    chord(BR, [41, 48, 53, 57, 60, 65, 69], BIG, 1.4, 86)
    chord(EP, [53, 57, 60, 65], BIG, 1.6, 50)
    for i, p in enumerate([77, 81, 84, 89, 93]):
        note(GL, p, BIG + i * 0.11, 0.7, 76)
    # the question + the lane change back: the groove returns and ends on F (frame 0)
    bed(Q, END - 0.6, vel=40, comp=32)
    chord(EP, [53, 57, 60, 65], END - 0.6, 0.6, 40)
    note(BS, 41, END - 0.6, 0.6, 44)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "t32-other-lane.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
