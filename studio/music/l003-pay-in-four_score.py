#!/usr/bin/env python3
"""Score for L003 "Why 'Pay in 4' Feels Free (It Isn't)" (long-form, ~4:31).

Mood: smooth late-night funk. 96 BPM, 4/4 -> 1 bar = 2.5 s. Syncopated finger bass + muted-guitar chops + rim clicks,
a soft Rhodes bed, and a cash-register "ding-ding" motif (glockenspiel) on every chapter start and the big reveals.
Sections follow the chapters (read from the voice cues): hook, 1 checkout, 2 pain meter (sparser, thoughtful),
3 slices (playful, a pizzicato answer), 4 tower (tension: stacked bass + a building kick), 5 rules (calm, straight),
wrap (resolve, brighter voicings) + end card. Sparse under the voice; energy sits in the gaps.
Writes l003-pay-in-four.mid next to this file. Render with tools/render_midi.py.
"""
import json
import os
import re

import mido

TPB = 480
BAR = TPB * 4
BPM = 96
SEC_PER_BAR = 60 / BPM * 4
HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.path.join(HERE, "..", "src", "l003-pay-in-four", "voice.ts")

KEYS, GTR, BASS, BELL, PIZZ, STR, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {KEYS: 4, GTR: 28, BASS: 33, BELL: 9, PIZZ: 45, STR: 49}

events = []


def note(ch, pitch, start, dur, vel):
    vel = max(1, min(127, int(vel)))
    events.append((int(start), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((int(start + dur), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def cc(ch, control, value, tick):
    events.append((tick, 0, mido.Message("control_change", channel=ch, control=control, value=value)))


CH = {
    "Em9": (40, [55, 59, 62, 66]),
    "A9": (45, [55, 59, 61, 64]),
    "Cmaj7": (36, [55, 59, 64, 67]),
    "B7": (47, [54, 57, 59, 63]),
    "Am9": (45, [55, 59, 60, 64]),
    "D9": (38, [54, 57, 60, 64]),
    "Gmaj7": (43, [54, 59, 62, 66]),
    "F#m7": (42, [54, 57, 61, 64]),
    "Bm7": (47, [54, 57, 62, 66]),
}

SECTIONS = {
    "hook": ["Em9", "A9", "Em9", "A9"],
    "ch1": ["Em9", "A9", "Cmaj7", "B7"],
    "ch2": ["Am9", "D9", "Gmaj7", "Cmaj7"],
    "ch3": ["Em9", "A9", "Em9", "B7"],
    "ch4": ["Cmaj7", "B7", "Em9", "B7"],
    "ch5": ["Gmaj7", "D9", "Am9", "Cmaj7"],
    "wrap": ["Gmaj7", "F#m7", "Bm7", "Em9"],
}

# syncopated funk bass pattern (16th steps 0..15 -> interval above root, velocity)
BASS_PAT = {
    "main": [(0, 0, 84), (3, 12, 60), (6, 0, 70), (8, 7, 66), (10, 10, 62), (11, 12, 58), (14, 0, 66)],
    "sparse": [(0, 0, 74), (8, 7, 60)],
    "drive": [(0, 0, 86), (2, 0, 62), (4, 0, 76), (6, 12, 60), (8, 0, 80), (10, 0, 62), (12, 7, 70), (14, 10, 64)],
}


def load_cues():
    t = open(VOICE).read()
    cues = json.loads(re.search(r"VOICE_CUES: VCue\[\] = (\[.*?\]);\n", t, re.S).group(1))
    frames = int(re.search(r"VOICE_FRAMES = (\d+)", t).group(1))
    return cues, frames


def main():
    cues, frames = load_cues()
    total_s = frames / 30
    starts = {"hook": 0, "ch1": 9, "ch2": 21, "ch3": 40, "ch4": 52, "ch5": 66, "wrap": 73}
    sec_t = {k: cues[i]["startFrame"] / 30 if i else 0.0 for k, i in starts.items()}
    reveal63 = cues[57]["startFrame"] / 30
    stack = cues[63]["startFrame"] / 30
    end_card = cues[81]["startFrame"] / 30
    nbars = int(total_s / SEC_PER_BAR) + 2
    order = list(starts.keys())
    S16 = TPB // 4

    def section(t):
        cur = "hook"
        for k in order:
            if t >= sec_t[k] - 0.3:
                cur = k
        return cur

    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {KEYS: 72, GTR: 70, BASS: 96, BELL: 86, PIZZ: 76, STR: 70, DRUMS: 86}.items():
        cc(ch, 7, vol, 0)
    for ch, pan in {GTR: 88, KEYS: 48, BELL: 70, PIZZ: 36, STR: 60}.items():
        cc(ch, 10, pan, 0)
    for ch in (KEYS, BELL, PIZZ, STR):
        cc(ch, 91, 70, 0)

    seen = set()
    for b in range(nbars):
        t0 = b * SEC_PER_BAR
        if t0 > total_s + 1:
            break
        sec = section(t0 + 0.2)
        prog = SECTIONS[sec]
        name = prog[b % 4]
        root, v = CH[name]
        s = b * BAR
        tower_build = sec == "ch4" and t0 >= stack - SEC_PER_BAR
        # Rhodes bed: two soft stabs per bar (on 1 and the "and" of 2)
        for p in v:
            note(KEYS, p, s, TPB * 3 // 2, 38 if sec != "wrap" else 46)
            if sec not in ("ch2", "ch5"):
                note(KEYS, p, s + TPB * 5 // 2, TPB, 30)
        # bass
        pat = "sparse" if sec in ("hook",) and b < 2 else "sparse" if sec == "ch2" else "drive" if (sec == "ch4") else "main"
        for st, iv, vel in BASS_PAT[pat]:
            note(BASS, root + iv, s + st * S16, S16 * 2 - 30, vel)
        # muted guitar chops on 16ths (offbeat-heavy), skipped in ch2/ch5 for space
        if sec not in ("ch2", "ch5") and not (sec == "hook" and b < 1):
            for k in range(16):
                if k % 4 in (1, 3) or k in (6, 14):
                    note(GTR, v[1] + 12, s + k * S16, S16 - 20, 40 + (k % 4 == 3) * 8)
        if sec == "ch5":
            for k in (2, 6):
                note(GTR, v[2] + 12, s + k * TPB // 2, TPB // 2, 38)
        # pizzicato answer in ch3 (the slices): four plucks = four slices
        if sec == "ch3":
            for k, p in enumerate([v[3] + 12, v[2] + 12, v[1] + 12, v[0] + 12]):
                note(PIZZ, p, s + TPB * 2 + k * (TPB // 2), TPB // 2, 52)
        # strings: thoughtful swell in ch2, rising tension in ch4, warm in wrap
        if sec in ("ch2", "ch4", "wrap"):
            for p in v[:3]:
                note(STR, p, s, BAR, 40 if sec != "ch4" else 46 + int(min(20, max(0, t0 - stack) * 2)))
        # drums: rim clicks + hats, kick on 1 and the "a" of 2; four-on-the-floor build in the tower
        if not (sec == "hook" and b < 1):
            for k in range(8):
                note(DRUMS, 42, s + k * (TPB // 2), TPB // 4, 44 if k % 2 else 34)
            note(DRUMS, 37, s + TPB, TPB // 4, 52)  # rim click on 2
            note(DRUMS, 37, s + 3 * TPB, TPB // 4, 52)  # rim click on 4
            if sec != "ch2":
                note(DRUMS, 36, s, TPB // 2, 74)
                note(DRUMS, 36, s + TPB * 7 // 4, TPB // 4, 58)
            if tower_build:
                for k in range(4):
                    note(DRUMS, 36, s + k * TPB, TPB // 2, 70 + k * 4)
                note(DRUMS, 38, s + 2 * TPB, TPB // 2, 60)
            if b % 4 == 3:  # little fill at the end of each phrase
                for k in range(3):
                    note(DRUMS, 37, s + 3 * TPB + TPB // 2 + k * (TPB // 6), TPB // 8, 44 + k * 8)
        # cash-register ding-ding at each chapter start
        if sec not in seen:
            seen.add(sec)
            note(BELL, 88, s, TPB // 2, 82)
            note(BELL, 96, s + TPB // 2, TPB, 86)
            if sec != "hook":
                note(DRUMS, 49, s, TPB, 66)
    # reveal stingers: the 63% and the stack
    for t in (reveal63, stack):
        tick = int(t / SEC_PER_BAR * BAR)
        note(BELL, 91, tick, TPB, 80)
        note(BELL, 98, tick + TPB // 4, TPB, 84)
        note(DRUMS, 49, tick, TPB, 72)
    # end card: resolve on Em9 with a final ding
    end_tick = int(end_card / SEC_PER_BAR * BAR)
    for p in CH["Em9"][1]:
        note(KEYS, p, end_tick, BAR * 2, 56)
    note(BASS, 40, end_tick, BAR, 74)
    note(BELL, 88, end_tick, TPB, 76)
    note(BELL, 100, end_tick + TPB // 2, BAR, 80)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "l003-pay-in-four.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s, voice {total_s:.1f} s)")


if __name__ == "__main__":
    main()
