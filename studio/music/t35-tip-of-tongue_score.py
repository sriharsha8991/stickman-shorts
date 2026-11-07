#!/usr/bin/env python3
"""Score for T35 "Why does a word hide when you need it?" (Spark Got Tricked #9).

D major, 100 BPM, light office jazz: vibraphone comping, upright bass, soft ride (a bed under the voice).
Timed in seconds against the voice (voice.ts): yank stings at 1.5 s and 15.2 s, music drop 16.2-17.0 s (lights down),
tension 17.0-19.8 s (tremolo strings + wood-block ticks while Spark tries letters), the hit on "often!" at 19.87 s
(timpani + brass + glockenspiel run), then a lighter groove that ends on Dmaj7 so it loops into frame 0.
Writes t35-tip-of-tongue.mid next to this file. Render with tools/render_midi.py.
"""
import os
import mido

TPB = 480
BPM = 100
TPS = TPB * BPM / 60  # ticks per second
HERE = os.path.dirname(os.path.abspath(__file__))
VIBE, BASS, STR, TREM, BRASS, TIMP, GLOCK, CELESTA, DR = 0, 1, 2, 3, 4, 5, 6, 7, 9
PROGRAMS = {VIBE: 11, BASS: 32, STR: 48, TREM: 44, BRASS: 61, TIMP: 47, GLOCK: 9, CELESTA: 8}
ev = []


def t(sec):
    return int(round(sec * TPS))


def note(ch, p, s, d, v):
    ev.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    ev.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


BEAT = 60 / BPM
BAR = 4 * BEAT
PROG = [("Dmaj7", 38, [62, 66, 69, 73]), ("Bm7", 35, [62, 66, 69, 71]), ("Em7", 40, [62, 64, 67, 71]), ("A7", 33, [61, 64, 67, 69])]
WALK = {"Dmaj7": [38, 42, 45, 47], "Bm7": [35, 38, 42, 40], "Em7": [40, 43, 47, 45], "A7": [33, 37, 40, 43]}


def groove(s0, s1, vib=34, bass=46, ride=22):
    b = 0
    s = s0
    while s < s1 - 0.05:
        name, root, voic = PROG[b % 4]
        for i in range(4):
            bs = s + i * BEAT
            if bs >= s1:
                break
            note(BASS, WALK[name][i], bs, BEAT * 0.9, bass)
            note(DR, 51, bs, 0.1, ride - (6 if i % 2 == 0 else 0))
            if i in (1, 3):
                chord(VIBE, voic, bs + BEAT * 0.5 * (i == 3), BEAT * 0.8, vib)
        s += BAR
        b += 1


def gliss_up(s, ch=VIBE, v=55):
    for i, p in enumerate([74, 76, 78, 81, 83, 86]):
        note(ch, p, s + i * 0.04, 0.3, v)


def gliss_down(s, ch=VIBE, v=50):
    for i, p in enumerate([86, 83, 81, 78, 76, 74, 71]):
        note(ch, p, s + i * 0.05, 0.3, v)


# 0-16.1 s: the meeting groove (quiet under the voice)
groove(0.0, 16.1)
gliss_up(1.45)  # the word is yanked away
note(CELESTA, 81, 11.5, 0.4, 50)  # "once" ding
gliss_up(15.15)  # it hides again
gliss_down(15.6, v=42)
# 16.2-17.0 s: drop (nothing)
# 17.0-19.8 s: tension
for p in (45, 57):
    ev.append((t(17.0), 1, mido.Message("note_on", channel=TREM, note=p, velocity=55)))
    ev.append((t(19.8), 0, mido.Message("note_off", channel=TREM, note=p, velocity=0)))
for i in range(28):
    ev.append((t(17.0 + i * 0.1), 0, mido.Message("control_change", channel=TREM, control=11, value=min(127, 50 + i * 3))))
for i in range(6):
    note(DR, 76, 17.3 + i * 0.17, 0.08, 50 + i * 5)  # letters flicker
note(CELESTA, 86, 18.33, 0.6, 70)  # S!
note(TIMP, 45, 19.3, 0.5, 60)
note(TIMP, 45, 19.55, 0.3, 75)
# 19.87 s: the hit
H = 19.87
note(TIMP, 38, H, 1.6, 120)
note(DR, 49, H, 1.5, 100)
chord(BRASS, [50, 57, 62, 66, 69], H, 1.8, 112)
chord(STR, [50, 57, 62, 66, 69, 74], H, 3.4, 85)
for i, p in enumerate([74, 78, 81, 86, 90, 93]):
    note(GLOCK, p, H + 0.05 + i * 0.07, 0.6, 90)
chord(BRASS, [52, 57, 61, 64, 69], H + 2.0, 0.5, 70)  # a small "ta-da" answer
chord(BRASS, [50, 57, 62, 66, 69], H + 2.4, 1.0, 80)
# 22.4-28.9 s: lighter groove, ends on Dmaj7 for the loop
groove(22.4, 27.8, vib=30, bass=40, ride=18)
gliss_down(26.0, v=40)  # the new card comes down
chord(VIBE, [62, 66, 69, 73], 27.8, 1.1, 44)
note(BASS, 38, 27.8, 1.1, 50)

# write
mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
for ch, prog in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
tr.append(mido.Message("control_change", channel=TREM, control=11, value=50, time=0))
last = 0
for tick, _, msg in sorted(ev, key=lambda e: (e[0], e[1])):
    tr.append(msg.copy(time=tick - last))
    last = tick
out = os.path.join(HERE, "t35-tip-of-tongue.mid")
mid.save(out)
print("wrote", out)
