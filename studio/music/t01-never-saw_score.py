#!/usr/bin/env python3
"""Score for T01 "Why might you remember one word you never saw?" (t01-never-saw). Spark Got Tricked #8.

Bedtime lullaby in Ab major, 80 BPM: harp arpeggios, a soft string pad, upright bass, a low clarinet line
(different from T32's car-radio groove, T11's accordion, T26's bossa, T17's tuba, T36's guitar, T37's music box).
The read test is almost silent (one very soft held pad chord), plucked bass steps under the question, a cheeky
clarinet slide on "YES!", half a second of silence, timpani + brass + glockenspiel on "there!", a harp glissando
and the biggest chord on "added sleep", a light clarinet tune at the TV, and back to the frame-0 harp so it loops.
"""
import os
import mido

BPM = 80
TPB = 480
SEC = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
HP, PD, BS, CL, BR, TI, GL = 0, 1, 2, 3, 4, 5, 6
PROGRAMS = {HP: 46, PD: 49, BS: 32, CL: 71, BR: 61, TI: 47, GL: 9}
FPS = 30
TRICK, PULL, STILL0, STILL1, YES, PULL2, DROP, HIT, SMASH, BIG, TV, Q, END = [
    x / FPS for x in (106, 176, 222, 465, 521, 551, 592, 607, 623, 734, 765, 969, 1055)]
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
# Ab - Fm - Db - Eb
CHANGES = [(44, [56, 60, 63]), (41, [56, 60, 65]), (37, [56, 61, 65]), (39, [55, 58, 63])]


def bed(a, b, vel=40, pad=24, bass=True):
    """harp arpeggio in eighths, soft pad held per bar, bass on beat 1"""
    s, i = a, 0
    while s < b - 0.3:
        root, ch = CHANGES[i % 4]
        bar = min(4 * BEAT, b - s)
        chord(PD, ch, s, bar * 0.95, pad)
        if bass:
            note(BS, root, s, BEAT * 1.5, vel)
        arp = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]]
        for h, p in enumerate(arp):
            at = s + h * 0.5 * BEAT
            if at < b - 0.1:
                note(HP, p, at, 0.6, vel - 4 - (h % 2) * 6)
        s += 4 * BEAT
        i += 1


def main():
    for ch, pr in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=pr)))
    bed(0.05, PULL - 0.1)
    # Mr. Trick pulls the cord: a harp run up as the list unrolls
    for i, p in enumerate([56, 60, 63, 68, 72, 75]):
        note(HP, p, PULL + i * 0.08, 0.5, 46)
    # the read test: one very soft held chord, nothing moves
    chord(PD, [56, 60, 63], PULL + 0.6, STILL1 - PULL - 0.8, 18)
    # the question: plucked bass steps, the bubble fills
    for i in range(int((YES - STILL1) / (BEAT / 2))):
        note(BS, [44, 48, 51, 53][i % 4], STILL1 + i * BEAT / 2, 0.3, 40)
    # "YES!": cheeky clarinet slide up
    for i, p in enumerate([56, 58, 60, 63, 68]):
        note(CL, p, YES + i * 0.07, 0.25 if i < 4 else 0.6, 54)
    # the list unrolls again, tension: low clarinet + bass pedal
    note(HP, 68, PULL2, 0.4, 40)
    note(BS, 39, PULL2, DROP - PULL2, 36)
    note(CL, 51, PULL2 + 0.3, DROP - PULL2 - 0.4, 38)
    # DROP: half a second of nothing. HIT: "there!"
    note(TI, 44, HIT, 0.4, 100)
    note(TI, 51, HIT + 0.18, 0.5, 90)
    chord(BR, [44, 51, 56, 60, 63], HIT, 0.9, 80)
    for i, p in enumerate([80, 84, 87]):
        note(GL, p, HIT + i * 0.1, 0.5, 70)
    # the word smashes: glock tinkle down
    for i, p in enumerate([87, 84, 80, 75, 72]):
        note(GL, p, SMASH + i * 0.07, 0.3, 54)
    # "Your brain saw bed and dream": soft bed again, building
    bed(SMASH + 0.8, BIG - 0.5, vel=36, pad=26)
    for i, p in enumerate(range(56, 92, 2)):
        note(HP, p, BIG - 0.5 + i * 0.027, 0.4, 40 + i)
    # the biggest moment: "added sleep"
    note(TI, 44, BIG, 0.35, 104)
    note(TI, 51, BIG + 0.2, 0.5, 92)
    chord(BR, [44, 51, 56, 60, 63, 68, 72], BIG, 1.4, 86)
    chord(PD, [56, 60, 63, 68], BIG, 1.8, 50)
    for i, p in enumerate([80, 84, 87, 92, 96]):
        note(GL, p, BIG + i * 0.11, 0.7, 74)
    # the TV: a light clarinet tune over the harp
    bed(TV, Q - 0.2, vel=34, pad=22)
    for i, (p, d) in enumerate([(63, 0.5), (65, 0.25), (67, 0.25), (68, 1.0), (72, 0.5), (70, 0.5), (68, 1.0)]):
        note(CL, p, TV + 0.4 + sum(x[1] for x in [(63, 0.5), (65, 0.25), (67, 0.25), (68, 1.0), (72, 0.5), (70, 0.5), (68, 1.0)][:i]) * BEAT, d * BEAT, 42)
    # the question: back to the frame-0 harp, ending on Ab
    bed(Q, END - 0.6, vel=38, pad=24)
    chord(PD, [56, 60, 63, 68], END - 0.6, 0.6, 30)
    note(BS, 44, END - 0.6, 0.6, 40)
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for at, _, msg in events:
        tr.append(msg.copy(time=at - last))
        last = at
    out = os.path.join(HERE, "t01-never-saw.mid")
    mid.save(out)
    print(out)


if __name__ == "__main__":
    main()
