#!/usr/bin/env python3
"""Score for V026 "Only 2 left!" (Designed to get you, 31.1 s).

120 BPM, 4/4 -> 1 bar = 2 s. 16 bars. Lo-fi Rhodes + plucked synth bass + woodblock "clock" ticks, D minor.
Different from V102 (pizzicato/marimba F major 104) and V025 (lounge noir A minor 84).
  0.0-2.6 s   hook: woodblock ticks (urgency clock), low D pedal, Rhodes Dm9 stab
  2.6-5.4 s   bass pulse joins (overpay)
  5.4-12.5 s  test kitchen: light vibraphone + Rhodes, F / C / Dm / Bb, very sparse
  12.5-15.3 s tension: strings swell, ticks double -> hit on "EVEN MORE" (15.3 s)
  17.0-20.2 s shop: riser, half-second drop (19.7-20.2 s), hit on the warehouse reveal (20.2 s)
  20.2-24.5 s soft groove: kick, rim, bass, Dm Bb F C
  24.5-28.4 s sunrise: bright F major, acoustic pluck + vibes
  28.4-31.1 s hook motif returns for the loop
"""
import os
import mido

TPB = 480
BEAT = TPB
HERE = os.path.dirname(os.path.abspath(__file__))
RHODES, PAD, VIBES, BASS, STR, GTR, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {RHODES: 4, PAD: 89, VIBES: 11, BASS: 38, STR: 48, GTR: 25}
ev = []

def t(sec):  # seconds -> ticks at 120 BPM (1 beat = 0.5 s)
    return int(round(sec * 2 * TPB))

def note(ch, p, s, d, v):
    ev.append((t(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
    ev.append((t(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))

def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)

WOOD, KICK, RIM, HAT, CRASH = 76, 36, 37, 42, 49

# hook + loop: clock ticks, D pedal, Dm9 stab
for s0, s1 in [(0.0, 2.6), (28.4, 31.1)]:
    x = s0
    while x < s1:
        note(DRUMS, WOOD, x, 0.1, 58 if int(round(x * 4)) % 2 == 0 else 40)
        x += 0.25
    note(BASS, 38, s0, s1 - s0, 70)
    chord(RHODES, [50, 53, 57, 60, 64], s0 + 0.05, 1.2, 62)
    chord(PAD, [50, 57, 62], s0, s1 - s0, 38)
# overpay: bass pulse 8ths + ticks
x = 2.6
while x < 5.4:
    note(BASS, 38 if x < 4.0 else 41, x, 0.22, 66)
    note(DRUMS, WOOD, x, 0.1, 34)
    x += 0.5
chord(RHODES, [53, 57, 60, 65], 2.7, 1.3, 50)
chord(RHODES, [52, 55, 60, 64], 4.0, 1.3, 50)
# test kitchen: sparse vibes + Rhodes
prog = [(5.4, [41, [53, 57, 60, 64]]), (7.4, [36, [52, 55, 60, 64]]), (9.4, [38, [53, 57, 60, 62]]), (11.0, [34, [53, 58, 62, 65]])]
for s, (root, voi) in prog:
    note(BASS, root, s, 1.6, 52)
    chord(RHODES, voi, s, 1.7, 42)
for i, (s, p) in enumerate([(5.9, 72), (6.4, 76), (7.9, 72), (8.4, 79), (9.9, 77), (10.4, 74), (11.5, 77), (11.9, 81)]):
    note(VIBES, p, s, 0.45, 46)
# tension swell + doubled ticks
chord(STR, [50, 57, 62], 12.5, 2.8, 40)
chord(STR, [52, 58, 64], 13.9, 1.4, 52)
x = 12.6
while x < 15.2:
    note(DRUMS, WOOD, x, 0.08, 30 + int((x - 12.6) * 10))
    x += 0.125
# hit on EVEN MORE
note(DRUMS, CRASH, 15.3, 1.5, 80)
note(DRUMS, KICK, 15.3, 0.3, 95)
chord(RHODES, [50, 53, 57, 62, 65], 15.3, 1.4, 70)
note(BASS, 38, 15.3, 1.4, 80)
# shop: low pad + riser strings, drop, then reveal hit
chord(PAD, [46, 53, 58], 17.0, 2.7, 34)
for k, p in enumerate([57, 58, 60, 62, 63, 65]):
    note(STR, p, 17.0 + k * 0.45, 0.45, 36 + k * 6)
note(DRUMS, CRASH, 20.2, 1.8, 90)
note(DRUMS, KICK, 20.2, 0.3, 110)
chord(RHODES, [50, 57, 60, 65], 20.2, 1.6, 74)
# groove Dm Bb F C under the regulator lines (sparse)
grv = [(20.2, 38, [50, 57, 60, 65]), (21.3, 34, [50, 53, 58, 62]), (22.4, 41, [53, 57, 60, 64]), (23.5, 36, [52, 55, 60, 64])]
for s, r, v in grv:
    note(BASS, r, s, 0.3, 70)
    note(BASS, r, s + 0.55, 0.25, 55)
    if s > 20.3:
        chord(RHODES, v, s, 1.0, 44)
x = 20.2
while x < 24.5:
    b = int(round((x - 20.2) * 2)) % 4
    if b in (0, 2):
        note(DRUMS, KICK, x, 0.2, 70)
    if b in (1, 3):
        note(DRUMS, RIM, x, 0.1, 50)
    note(DRUMS, HAT, x + 0.25, 0.05, 30)
    x += 0.5
# sunrise: F major, pluck + vibes
for s, r, v in [(24.5, 41, [53, 57, 60, 65]), (25.5, 36, [55, 60, 64, 67]), (26.5, 34, [53, 58, 62, 65]), (27.5, 41, [53, 57, 60, 65])]:
    note(BASS, r, s, 0.9, 54)
    for k, p in enumerate(v):
        note(GTR, p, s + k * 0.12, 0.8, 50)
for s, p in [(25.0, 77), (26.0, 79), (27.0, 81), (27.9, 84)]:
    note(VIBES, p, s, 0.5, 44)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack(); mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(120), time=0))
for ch, prg in PROGRAMS.items():
    tr.append(mido.Message("program_change", channel=ch, program=prg, time=0))
tr.append(mido.Message("control_change", channel=PAD, control=7, value=80, time=0))
last = 0
for tick, _, msg in sorted(ev, key=lambda e: (e[0], e[1])):
    tr.append(msg.copy(time=tick - last)); last = tick
out = os.path.join(HERE, "v026-only-two-left.mid")
mid.save(out); print("wrote", out)
