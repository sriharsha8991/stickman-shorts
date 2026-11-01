#!/usr/bin/env python3
"""Score for V019 "Why does your chatbot guess?" (v019-sure-but-wrong).

100 BPM, 4/4 (1 beat = 18 video frames). Notes are placed by VIDEO FRAME so the sections follow the voice:
  0-395     chat at the laptop: pizzicato + marimba, E minor -> C -> G -> D, sparse under the voice
  395-629   the school test: woodblock clock ticks, pizzicato walking bass, clarinet answers in the gaps
  644-659   half-second music drop (silence) before the reveal
  659-806   REVEAL: timpani + string hit on "Chatbots", glockenspiel arpeggio, playful square-lead blips for the robots
  806-1039  resolve in G major, celesta, ends back on Em so the loop into frame 0 is seamless
Writes v019-sure-but-wrong.mid next to this file. Render with tools/render_midi.py.
"""
import os

import mido

TPB = 480
HERE = os.path.dirname(os.path.abspath(__file__))
BPM = 100
PIZZ, MAR, CLAR, BASS, GLOCK, STR, TIMP, LEAD, CEL, DRUMS = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
PROGRAMS = {PIZZ: 45, MAR: 12, CLAR: 71, BASS: 32, GLOCK: 9, STR: 48, TIMP: 47, LEAD: 80, CEL: 8}
events = []
BEAT = 18  # frames per beat at 100 BPM / 30 fps


def tk(frame):
    return int(round(frame / BEAT * TPB))


def note(ch, pitch, f0, dur_f, vel):
    events.append((tk(f0), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((tk(f0 + dur_f), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


CH = {
    "Em": (40, [55, 59, 64]),
    "C": (36, [55, 60, 64]),
    "G": (43, [55, 59, 62]),
    "D": (38, [54, 57, 62]),
    "Am": (45, [57, 60, 64]),
    "B7": (47, [54, 59, 63]),
}


def bar_pizz(f0, name, vel=40):
    root, v = CH[name]
    note(BASS, root, f0, BEAT * 2, vel)
    note(BASS, root + 7, f0 + BEAT * 2, BEAT * 2, vel - 6)
    for k, off in enumerate([0, 1, 2, 3]):
        note(PIZZ, v[k % 3], f0 + off * BEAT, BEAT // 2, vel - 6 - (k % 2) * 4)


# --- chat at the laptop (frames 0-395): sparse pizz + marimba ticks in the gaps
prog = ["Em", "C", "G", "D", "Em", "C"]
for i, n in enumerate(prog):
    bar_pizz(i * 4 * BEAT, n, 38)
for f0, p in [(98, 76), (104, 79), (185, 74), (190, 78), (280, 76), (286, 83), (365, 71), (371, 67)]:
    note(MAR, p, f0, 10, 44)

# --- the school test (395-629): clock ticks + walking bass + clarinet answers in the gaps
for k in range(int((629 - 395) / BEAT)):
    f0 = 395 + k * BEAT
    note(DRUMS, 76 if k % 2 == 0 else 77, f0, 4, 34)  # woodblock tick-tock
walk = [40, 43, 45, 47, 48, 47, 45, 43, 40, 43, 45, 47, 48]
for k, p in enumerate(walk):
    note(BASS, p, 395 + k * BEAT, BEAT - 2, 36)
for n, f0 in [("Am", 395), ("Em", 467), ("C", 539), ("B7", 593)]:
    for p in CH[n][1]:
        note(STR, p - 12, f0, 70, 22)
for f0, p in [(470, 71), (476, 74), (551, 72), (557, 71), (630, 69)]:
    note(CLAR, p, f0, 14, 40)

# --- drop: nothing between 644 and 659
# --- REVEAL (659-806)
note(TIMP, 40, 659, 30, 96)
note(TIMP, 52, 659, 30, 80)
for p in [52, 59, 64, 67, 71]:
    note(STR, p, 659, 54, 70)
for k, p in enumerate([76, 79, 83, 88, 91, 88, 83, 79]):
    note(GLOCK, p, 663 + k * 5, 10, 62 - k * 3)
for i, n in enumerate(["Em", "C", "D", "G"]):
    f0 = 700 + i * 2 * BEAT
    root, v = CH[n]
    note(BASS, root, f0, BEAT * 2 - 2, 44)
    for p in v:
        note(STR, p - 12, f0, BEAT * 2, 26)
for k, p in enumerate([76, 79, 83, 79, 81, 78, 74, 78, 79, 83, 86, 83]):  # robot blips (quiet, staccato)
    note(LEAD, p, 700 + k * 9, 4, 22)
for f0, p in [(770, 79), (778, 83), (786, 86)]:  # the three guesses B! D! A!
    note(MAR, p, f0, 8, 50)

# --- resolve (806-1039), back to Em for the loop
for i, n in enumerate(["G", "D", "C", "D", "Em"]):
    f0 = 812 + i * 2 * BEAT
    root, v = CH[n]
    note(BASS, root, f0, BEAT * 2 - 2, 38)
    for k, p in enumerate(v):
        note(PIZZ, p, f0 + k * 6, 8, 32)
for f0, p in [(900, 79), (906, 83), (975, 86), (981, 83), (990, 79)]:
    note(CEL, p, f0, 14, 46)
bar_pizz(1000, "Em", 34)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
for ch, pg in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=pg, time=0))
    tr.append(mido.Message("control_change", channel=ch, control=91, value=50, time=0))
last = 0
for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
    tr.append(m.copy(time=t - last))
    last = t
mid.save(os.path.join(HERE, "v019-sure-but-wrong.mid"))
print("wrote v019-sure-but-wrong.mid")
