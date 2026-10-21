#!/usr/bin/env python3
"""Score for V006 "The first computer bug was a real bug" (v006-first-bug).

Storybook documentary, 96 BPM, D minor -> F major. Original MIDI: felt piano, strings, pizzicato,
celesta, harp, timpani, French horn. Every section is placed on spoken words read from voice.ts:
  hook (cue 0)            solo piano motif, very sparse (bed under the voice)
  1947 + machine (1-3)    soft string pad; pizzicato ostinato on "clicking relay switches"
  hunt (4-5)              tremolo strings + low piano pulse (tension)
  "moth." (6)             timpani + string swell
  logbook (7-8)           gentle piano arpeggios
  "Actual." (9)           celesta sparkle (the aha), then a smug pizz figure
  rewind (11)             descending harp glissando; letter (12) warm strings
  "MYTH" / "famous" (13-14) timpani on MYTH, short horn fanfare on "famous"
  museum + payoff (15-17) piano motif returns, ends on the opening chord (loop)
Writes v006-first-bug.mid next to this file.
"""
import json
import os
import re

import mido

TPB = 480
BPM = 96
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO, STR, PIZZ, CEL, HARP, TIMP, HORN = 0, 1, 2, 3, 4, 5, 6
PROGRAMS = {PIANO: 0, STR: 48, PIZZ: 45, CEL: 8, HARP: 46, TIMP: 47, HORN: 60}
BEAT_F = 30 * 60 / BPM
events = []

voice = open(os.path.join(HERE, "..", "src", "v006-first-bug", "voice.ts")).read()
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


Dm = [62, 65, 69]
Bb = [58, 62, 65]
F = [60, 65, 69]
C_ = [60, 64, 67]
Gm = [58, 62, 67]
A = [61, 64, 69]


def motif(f0, vel=46):
    """Music-box piano motif: D F A G F E D (quarter = BEAT_F frames)."""
    for k, p in enumerate([74, 77, 81, 79, 77, 76, 74]):
        note(PIANO, p, f0 + k * BEAT_F * 0.75, f0 + (k + 1) * BEAT_F * 0.75, vel - k * 2)


def pad(f0, f1, ch, vel=40):
    chord(STR, [p - 12 for p in ch], f0, f1, vel)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {PIANO: 92, STR: 78, PIZZ: 84, CEL: 88, HARP: 84, TIMP: 90, HORN: 80}.items():
        events.append((0, 0, mido.Message("control_change", channel=ch, control=7, value=vol)))
        events.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=70)))

    # hook: motif in the gap before the voice, then a held low D
    motif(0, 44)
    note(PIANO, 50, 0, C(1), 40)
    # 1947: string pad Dm -> Bb
    pad(C(1), C(2), Dm, 40)
    note(TIMP, 38, C(1), C(1) + 20, 70)
    pad(C(2), C(3), Bb, 40)
    # clicking relays: pizzicato ostinato in eighths
    f = C(3)
    k = 0
    while f < C(4):
        note(PIZZ, [62, 69, 65, 69][k % 4], f, f + BEAT_F / 2, 56)
        f += BEAT_F / 2
        k += 1
    # hunt: tremolo-ish repeated strings + low piano pulse
    pad(C(4), W(6, 1), [61, 64, 69], 46)
    f = C(4)
    while f < W(6, 1) - 4:
        note(PIANO, 38, f, f + BEAT_F / 2, 50)
        f += BEAT_F
    # moth hit
    note(TIMP, 38, W(6, 1), W(6, 1) + 40, 112)
    chord(STR, [50, 57, 62, 65], W(6, 1), C(7), 70)
    # logbook: gentle arpeggios F -> C
    for (ch, a, b) in [(F, C(7), C(8)), (C_, C(8), C(9))]:
        f = a
        k = 0
        while f < b - 4:
            note(PIANO, ch[k % 3] + (12 if k % 4 == 3 else 0), f, f + BEAT_F, 40)
            f += BEAT_F / 2
            k += 1
    # aha: celesta sparkle on "Actual."
    for k, p in enumerate([81, 84, 86, 89, 93]):
        note(CEL, p, W(9, 4) + k * 2.5, W(9, 4) + 30, 70)
    # smug pizz figure under the joke line
    for k, p in enumerate([62, 65, 69, 65, 62]):
        note(PIZZ, p, C(10) + k * BEAT_F, C(10) + k * BEAT_F + BEAT_F / 2, 48)
    # rewind: descending harp glissando
    for k, p in enumerate(range(91, 55, -3)):
        note(HARP, p, C(11) + k * 2, C(11) + k * 2 + 20, 64)
    # letter: warm strings Gm -> A
    pad(C(12), C(12) + (C(13) - C(12)) // 2, Gm, 44)
    pad(C(12) + (C(13) - C(12)) // 2, C(13), A, 44)
    # myth stamp + famous fanfare
    note(TIMP, 38, W(13, 4), W(13, 4) + 30, 100)
    pad(C(13), C(14), Dm, 38)
    for k, p in enumerate([65, 69, 72, 77]):
        note(HORN, p, W(14, 4) + k * 3, W(14, 4) + 40, 82)
    chord(STR, [53, 60, 65, 69], W(14, 4), C(15), 58)
    # museum: motif returns in F
    pad(C(15), C(16), F, 36)
    motif(C(15) + 4, 40)
    # payoff: Bb -> C -> back to the opening Dm (loop)
    pad(C(16), C(17), Bb, 36)
    pad(C(17), TOTAL - 20, Dm, 36)
    note(PIANO, 50, C(17), TOTAL, 40)
    for k, p in enumerate([74, 77, 81]):
        note(PIANO, p, TOTAL - 34 + k * 6, TOTAL, 40)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v006-first-bug.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
