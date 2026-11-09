#!/usr/bin/env python3
"""Score for T33 "Why does the way home feel shorter?" (Spark Got Tricked #14).

D major, 96 BPM, a sunny country road: steel-string guitar strums, upright bass, a soft brush shaker, an original four-bar
harmonica motif in the gaps; under the voice only chords. Timed in seconds against the voice (voice.ts): motif after the
hook (3.7 s); the ride out (7.0-9.6 s) is plodding: a low tuba walks in half notes, the guitar slows to one strum a bar; the
ride home (9.7-12.6 s) is bright: banjo rolls, the motif a step higher; a low pizzicato "plonk" on the map (12.8 s); a calm
bed for the scientist and the board; drop 22.7-23.7 s (silence); a rising harp run as the real bar grows (23.8-25.2 s); the
hit on "fast!" 25.9 s (timpani + brass + glockenspiel); a calm bed; the motif returns for the loop. Writes t33-way-home.mid.
"""
import os
import mido

TPB = 480
BPM = 96
TPS = TPB * BPM / 60
HERE = os.path.dirname(os.path.abspath(__file__))
GUIT, BASS, BANJO, HARM, BRASS, TIMP, GLOCK, PAD, TUBA, DR, HARP, PIZZ = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
PROGRAMS = {GUIT: 25, BASS: 32, BANJO: 105, HARM: 22, BRASS: 61, TIMP: 47, GLOCK: 9, PAD: 89, TUBA: 58, HARP: 46, PIZZ: 45}
ev = []


def t(sec):
    return int(round(sec * TPS))


def note(ch, p, s, d, v):
    ev.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    ev.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v, spread=0.0):
    for i, p in enumerate(ps):
        note(ch, p, s + i * spread, d, v)


BEAT = 60 / BPM
BAR = 4 * BEAT
PROG = [(50, [50, 57, 62, 66, 69]), (43, [55, 59, 62, 67, 71]), (45, [52, 57, 61, 64, 69]), (50, [50, 57, 62, 66, 69])]  # D G A D
MOTIF = [(74, 0.5), (76, 0.5), (78, 1.0), (76, 0.5), (74, 0.5), (71, 1.0)]  # original


def motif(s, v=62, up=0, ch=HARM):
    x = s
    for p, b in MOTIF:
        note(ch, p + up, x, b * BEAT * 0.9, v)
        x += b * BEAT


def bed(s0, s1, gv=34, bv=48, sh=14, b0=0, strums=2):
    b, s = b0, s0
    while s < s1 - 0.05:
        root, voic = PROG[b % 4]
        for i in range(strums):
            st = s + i * (BAR / strums)
            if st < s1:
                chord(GUIT, voic, st, min(BAR / strums * 0.95, s1 - st), gv - i * 4, spread=0.018)
        for i in range(4):
            bs = s + i * BEAT
            if bs >= s1:
                break
            if i in (0, 2):
                note(BASS, root - 12 + (7 if i == 2 else 0), bs, BEAT * 0.6, bv)
            note(DR, 69, bs + BEAT / 2, 0.06, sh)  # cabasa on the off-beats
        s += BAR
        b += 1


# 0-7.0 s: hook + promise
bed(0.0, 6.95)
motif(3.75, 58)
# 7.0-9.6 s: the ride out, plodding
bed(6.95, 9.65, gv=28, bv=0, sh=6, strums=1)
for i, p in enumerate([38, 36, 33, 31, 33]):
    note(TUBA, p, 7.0 + i * 0.55, 0.5, 58)
# 9.65-12.6 s: the ride home, bright
bed(9.65, 12.6, gv=38, bv=52, sh=18, b0=1, strums=4)
for i in range(22):
    p = [74, 78, 81, 78][i % 4]
    note(BANJO, p, 9.7 + i * BEAT / 2.2, 0.15, 46)
# 12.8 s: the map, a low plonk
note(PIZZ, 38, 12.85, 0.4, 82)
note(PIZZ, 37, 13.15, 0.6, 70)
# 13.3-22.7 s: the scientist and the board, a calm bed
bed(13.3, 22.65, gv=28, bv=40, sh=10, b0=2)
motif(16.35, 46)
# 22.65-23.7 s: the drop (silence); then the real bar grows: a harp run
for i, p in enumerate([62, 66, 69, 74, 78, 81, 86]):
    note(HARP, p, 23.8 + i * 0.19, 0.6, 52 + i * 3)
note(PAD, 50, 23.75, 2.2, 32)
# 25.9 s: the hit on "fast!"
H = 25.9
note(TIMP, 38, H - 0.15, 0.2, 70)
note(TIMP, 38, H, 1.6, 120)
note(DR, 49, H, 1.6, 100)
chord(BRASS, [50, 57, 62, 66, 69], H, 1.9, 108)
chord(PAD, [50, 57, 62, 66], H, 3.0, 76)
for i, p in enumerate([86, 90, 93, 98, 102]):
    note(GLOCK, p, H + 0.05 + i * 0.08, 0.6, 86)
# 27.9-30.9 s: calm bed, the motif returns for the loop
bed(27.85, 30.9, gv=30, bv=42, sh=12)
motif(29.3, 60)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
for ch, prog in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prog, time=0))
last = 0
for tick, _, msg in sorted(ev, key=lambda e: (e[0], e[1])):
    tr.append(msg.copy(time=tick - last))
    last = tick
out = os.path.join(HERE, "t33-way-home.mid")
mid.save(out)
print("wrote", out)
