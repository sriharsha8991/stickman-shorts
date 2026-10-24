#!/usr/bin/env python3
"""Score for L002 "ChatGPT Doesn't Know What It's Going to Say Next" (long-form, ~5:20).

Mood: wonder -> synth arpeggios + light glitch percussion, 110 BPM, a typewriter-bell motif.
110 BPM, 4/4 -> 1 bar = 2.18 s. Sections follow the chapters (read from the voice cues, so the score follows any
re-timed voiceover): hook, 1 autocomplete, 2 tokens, 3 the loop (build + big lift on the fast loop), 4 attention,
5 temperature (playful), 6 sure-and-wrong (tension), wrap-up (resolve) + end card. Each section gets its own chord
progression / variation; arps stay quiet under the voice, the bell rings on each chapter start.
Writes l002-next-guess.mid next to this file. Render with tools/render_midi.py.
"""
import json
import os
import re

import mido

TPB = 480
BAR = TPB * 4
BPM = 110
SEC_PER_BAR = 60 / BPM * 4
HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.path.join(HERE, "..", "src", "l002-next-guess", "voice.ts")

ARP, PAD, BASS, BELL, PLUCK, STR, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {ARP: 81, PAD: 89, BASS: 38, BELL: 9, PLUCK: 45, STR: 49}

events = []


def note(ch, pitch, start, dur, vel):
    vel = max(1, min(127, int(vel)))
    events.append((int(start), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
    events.append((int(start + dur), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))


def cc(ch, control, value, tick):
    events.append((tick, 0, mido.Message("control_change", channel=ch, control=control, value=value)))


CH = {
    "Cmaj7": (36, [60, 64, 67, 71]),
    "Am7": (45, [57, 60, 64, 67]),
    "Fmaj7": (41, [57, 60, 64, 65]),
    "G": (43, [55, 59, 62, 67]),
    "Em7": (40, [55, 59, 62, 64]),
    "D": (38, [54, 57, 62, 66]),
    "C": (36, [55, 60, 64, 67]),
    "Dm7": (38, [57, 60, 62, 65]),
    "E": (40, [56, 59, 64, 68]),
    "Am": (45, [57, 60, 64, 69]),
    "F": (41, [57, 60, 65, 69]),
    "Bb": (46, [58, 62, 65, 70]),
}

SECTIONS = {
    "hook": ["Cmaj7", "Am7", "Fmaj7", "G"],
    "ch1": ["Cmaj7", "Em7", "Fmaj7", "G"],
    "ch2": ["Am7", "Fmaj7", "C", "G"],
    "ch3": ["Am", "F", "C", "G"],
    "ch4": ["Em7", "C", "G", "D"],
    "ch5": ["F", "C", "Bb", "C"],
    "ch6": ["Am", "F", "Dm7", "E"],
    "wrap": ["Fmaj7", "G", "Cmaj7", "Cmaj7"],
}


def load_cues():
    t = open(VOICE).read()
    cues = json.loads(re.search(r"VOICE_CUES: VCue\[\] = (\[.*?\]);\n", t, re.S).group(1))
    frames = int(re.search(r"VOICE_FRAMES = (\d+)", t).group(1))
    return cues, frames


def main():
    cues, frames = load_cues()
    total_s = frames / 30
    starts = {"hook": 0, "ch1": 8, "ch2": 22, "ch3": 37, "ch4": 54, "ch5": 72, "ch6": 84, "wrap": 91}
    sec_t = {k: cues[i]["startFrame"] / 30 if i else 0.0 for k, i in starts.items()}
    fast_a = cues[45]["startFrame"] / 30
    fast_b = cues[46]["endFrame"] / 30
    end_card = cues[98]["endFrame"] / 30
    nbars = int(total_s / SEC_PER_BAR) + 2
    order = list(starts.keys())

    def section(t):
        cur = "hook"
        for k in order:
            if t >= sec_t[k] - 0.3:
                cur = k
        return cur

    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {ARP: 70, PAD: 74, BASS: 92, BELL: 88, PLUCK: 80, STR: 76, DRUMS: 84}.items():
        cc(ch, 7, vol, 0)
    for ch, pan in {ARP: 40, PLUCK: 88, BELL: 70, STR: 58}.items():
        cc(ch, 10, pan, 0)
    for ch in (ARP, PAD, BELL, PLUCK, STR):
        cc(ch, 91, 72, 0)

    seen = set()
    for b in range(nbars):
        t0 = b * SEC_PER_BAR
        if t0 > total_s:
            break
        sec = section(t0 + 0.2)
        prog = SECTIONS[sec]
        name = prog[b % 4]
        root, v = CH[name]
        s = b * BAR
        fast = fast_a - SEC_PER_BAR <= t0 <= fast_b
        tail = t0 >= end_card - 0.5
        # pad bed (always, quiet)
        for p in v[:3]:
            note(PAD, p - 12, s, BAR, 40 if not fast else 52)
        # bass: half notes (quarter pulse in the loop chapter and the fast loop)
        if sec in ("ch3",) or fast:
            for k in range(4):
                note(BASS, root, s + k * TPB, TPB - 40, 78 if k % 2 == 0 else 64)
        elif sec != "hook" or b >= 2:
            note(BASS, root, s, 2 * TPB - 40, 70)
            note(BASS, root + (7 if sec != "ch6" else 6), s + 2 * TPB, 2 * TPB - 40, 60)
        # synth arp: 8ths normally, 16ths in ch3 / fast loop, sparse in ch6
        step = TPB // 4 if (sec == "ch3" or fast) else TPB // 2
        n = BAR // step
        seq = [v[0], v[1], v[2], v[3], v[2], v[1]]
        if sec == "ch2":
            seq = [v[0], v[2], v[1], v[3]]
        if sec == "ch5":
            seq = [v[0], v[2] + 12, v[1], v[3]]
        for k in range(n):
            if sec == "ch6" and k % 2:
                continue
            vel = 34 + (k % 4 == 0) * 10
            if fast:
                vel = 46 + int(30 * (t0 - fast_a + SEC_PER_BAR) / max(1, fast_b - fast_a + SEC_PER_BAR))
            note(ARP, seq[k % len(seq)] + 12, s + k * step, step - 20, vel)
        # pluck counter-melody: one or two notes per bar (variation per chapter)
        if sec in ("ch1", "ch4", "wrap", "ch5"):
            note(PLUCK, v[3] + 12, s + TPB * 3 // 2, TPB, 52)
            if sec in ("ch4", "ch5"):
                note(PLUCK, v[2] + 12, s + TPB * 7 // 2, TPB // 2, 46)
        # strings swell in ch4 / ch6 / wrap
        if sec in ("ch4", "ch6", "wrap"):
            for p in v[:3]:
                note(STR, p, s, BAR, 44 if sec != "ch6" else 52)
        # glitch percussion: light, off-beat; full kit in the fast loop
        if sec != "hook" or b >= 2:
            for k in range(8):
                if k % 2 == 1:
                    note(DRUMS, 42, s + k * (TPB // 2), TPB // 4, 46)
            note(DRUMS, 37, s + TPB, TPB // 4, 40)  # rim
            if sec in ("ch3", "ch5") or fast:
                note(DRUMS, 36, s, TPB // 2, 82)
                note(DRUMS, 36, s + 2 * TPB, TPB // 2, 76)
                note(DRUMS, 39, s + 3 * TPB, TPB // 4, 60)
            if b % 4 == 3:  # glitchy 32nd stutter at the end of each phrase
                for k in range(4):
                    note(DRUMS, 42, s + 3 * TPB + TPB // 2 + k * (TPB // 8), TPB // 8, 40 + k * 6)
            if fast:
                for k in range(16):
                    note(DRUMS, 42, s + k * (TPB // 4), TPB // 8, 50 + (k % 4) * 6)
        # typewriter-bell motif at each chapter start (first bar of a new section)
        if sec not in seen:
            seen.add(sec)
            for k, p in enumerate([84, 88, 91]):
                note(BELL, p, s + k * (TPB // 2), TPB, 78)
            if sec != "hook":
                note(DRUMS, 49, s, TPB, 70)
        if tail:
            note(BELL, 84, s, BAR, 70)
    # final chord to close the end card
    end_tick = int(end_card / SEC_PER_BAR * BAR)
    for p in CH["Cmaj7"][1]:
        note(PAD, p, end_tick, BAR * 2, 58)
    note(BELL, 96, end_tick, BAR, 70)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "l002-next-guess.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s, voice {total_s:.1f} s)")


if __name__ == "__main__":
    main()
