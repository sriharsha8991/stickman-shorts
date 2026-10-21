#!/usr/bin/env python3
"""Score for V007 "Why the next episode starts by itself" (v007-autoplay).

Late-night lo-fi, 112 BPM, A minor -> C major. Original MIDI: electric piano (Rhodes), marimba,
fingered bass, soft kit, synth pad, glockenspiel. Placed on spoken words read from voice.ts:
  hook (cues 0-1)        Rhodes Am7 / Fmaj7, soft kick + rim, marimba "tick" on each episode drop
  countdown (2)          everything thins out to a ticking marimba (5 ticks) and a held pad
  autoplay flip (3-5)    groove returns; glock flourish on "flips"
  proof (6-8)            pad riser from "forty-two", full hit on "Eighty-two"
  twist (9-10)           drop to bass + pad; big hit + glock on "nudge"
  fix (11-12)            bright C major groove
  end (13)               back to Am7 and the ticking marimba (loops into the hook)
Writes v007-autoplay.mid next to this file.
"""
import json
import os
import re

import mido

TPB = 480
BPM = 112
HERE = os.path.dirname(os.path.abspath(__file__))
EP, MAR, BASS, PAD, GLOCK, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {EP: 4, MAR: 12, BASS: 33, PAD: 89, GLOCK: 9}
BEAT_F = 30 * 60 / BPM
events = []

voice = open(os.path.join(HERE, "..", "src", "v007-autoplay", "voice.ts")).read()
CUES = json.loads(re.search(r"VOICE_CUES: VCue\[\] = (\[.*?\]);", voice, re.S).group(1))
TOTAL = int(re.search(r"VOICE_FRAMES = (\d+)", voice).group(1))


def C(i):
    return CUES[i]["startFrame"]


def W(i, k):
    return CUES[i]["words"][k]["s"]


def fr(frame):
    return int(round(frame / BEAT_F * TPB))


def note(ch, p, f0, f1, vel):
    a, b = fr(f0), max(fr(f0) + 30, fr(f1))
    events.append((a, 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(vel))))))
    events.append((b, 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, f0, f1, vel):
    for p in ps:
        note(ch, p, f0, f1, vel)


CH = {
    "Am7": (45, [57, 60, 64, 67]),
    "Fmaj7": (41, [57, 60, 64, 65]),
    "Dm7": (50, [57, 60, 62, 65]),
    "E7": (40, [56, 59, 62, 64]),
    "C": (48, [55, 60, 64]),
    "G": (43, [55, 59, 62]),
    "F": (41, [57, 60, 65]),
}


def groove(f0, f1, prog, vel=42, drums=True):
    bar = BEAT_F * 4
    f = f0
    b = 0
    while f < f1 - 4:
        name = prog[b % len(prog)]
        root, v = CH[name]
        end = min(f + bar, f1)
        chord(EP, v, f, end - 2, vel)
        note(BASS, root - 12 + 12, f, f + BEAT_F * 1.5, vel + 10)
        note(BASS, root + 7 - 12 + 12, f + BEAT_F * 2.5, f + BEAT_F * 3.5, vel + 4)
        if drums:
            for k in range(4):
                t = f + k * BEAT_F
                if t >= f1:
                    break
                note(DRUMS, 36 if k in (0, 2) else 37, t, t + 4, vel + (8 if k in (0, 2) else -4))
                note(DRUMS, 42, t + BEAT_F / 2, t + BEAT_F / 2 + 3, vel - 14)
        f += bar
        b += 1


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {EP: 90, MAR: 88, BASS: 92, PAD: 70, GLOCK: 80, DRUMS: 76}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
    for ch in (EP, PAD, GLOCK, MAR):
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=55)))

    drops = [W(0, 4), W(0, 7), W(0, 10)]
    groove(0, C(2), ["Am7", "Fmaj7"], 38)
    for t in drops:
        note(MAR, 81, t + 14, t + 22, 64)
        note(MAR, 76, t + 18, t + 26, 54)
    # countdown: thin, ticking marimba + held pad
    chord(PAD, [57, 64, 69], C(2), C(3), 42)
    for k in range(5):
        note(MAR, 88 - (k % 2) * 7, W(2, 3) + k * 7, W(2, 3) + k * 7 + 5, 60)
    note(BASS, 33, W(2, 7) + 6, C(3), 60)
    # flip
    groove(C(3), C(6), ["Dm7", "E7", "Am7"], 40)
    for k, p in enumerate([76, 79, 84, 88]):
        note(GLOCK, p, W(3, 3) + k * 3, W(3, 3) + 24, 70)
    # proof: riser + hit
    for k, p in enumerate([57, 60, 64, 67, 69, 72]):
        note(PAD, p, W(7, 3) + k * ((W(8, 5) - W(7, 3)) / 6), W(8, 5), 36 + k * 6)
    groove(C(6), W(7, 3), ["F"], 34, drums=False)
    note(DRUMS, 49, W(8, 5), W(8, 5) + 10, 100)
    note(DRUMS, 36, W(8, 5), W(8, 5) + 4, 110)
    chord(EP, [57, 60, 64, 69], W(8, 5), C(9), 64)
    note(BASS, 45, W(8, 5), C(9), 66)
    # twist: bass + pad only, hit on nudge
    chord(PAD, [52, 59, 64], C(9), W(10, 2), 40)
    note(BASS, 40, C(9), W(10, 2), 54)
    note(DRUMS, 49, W(10, 2), W(10, 2) + 10, 104)
    note(DRUMS, 38, W(10, 2), W(10, 2) + 4, 110)
    for k, p in enumerate([84, 88, 91, 96]):
        note(GLOCK, p, W(10, 2) + k * 2, W(10, 2) + 30, 76)
    # fix: bright major
    groove(C(11), C(13), ["C", "G", "F", "C"], 42)
    # end: back to Am7 + ticking (loop)
    chord(EP, CH["Am7"][1], C(13), TOTAL, 36)
    note(BASS, 45, C(13), TOTAL, 46)
    for k in range(int((TOTAL - W(13, 4)) // 8)):
        note(MAR, 88 - (k % 2) * 7, W(13, 4) + k * 8, W(13, 4) + k * 8 + 5, 50)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v007-autoplay.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
