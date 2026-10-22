#!/usr/bin/env python3
"""Score for L001 "The Feed Decides" (long-form, ~4:55).

Curious -> building pulse: lo-fi electric piano + marimba + soft kick, 100 BPM, 4/4.
1 bar = 2.4 s = 72 video frames. 123 bars. Sections follow the chapters (bar = chapter start frame / 72):
  bars   0-9   hook + promise     EP + pad only, Dm9 / Bbmaj7 (sparse, curious)
  bars  10-26  CH1 the pick       marimba pulse enters + soft kick on 1 & 3
  bars  27-50  CH2 signals        + bass walk, light hats; marimba plays a "pipe" figure
  bars  51-74  CH3 ranking race   full pulse: kick 4-on-floor (soft), hats 8ths, arps on the race
  bars  75-93  CH4 the loop       drop to pad + heartbeat kick, minor (Gm Dm A) - tension; lift at the tighten
  bars  94-108 CH5 retrain        bright major groove (F C Bb C)
  bars 109-119 recap              groove, thinned
  bars 120-122 end card           EP + pad, back to the opening voicing (loop-friendly)
Neon synth stabs on each reveal (frames from the voice timeline). Sparse under the voice.
"""
import json
import os

import mido

TPB = 480
BAR = TPB * 4
BPM = 100
HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "..", "src", "l001-feed-decides", "timeline.json")))
CUES = TL["cues"]
NBARS = 123

EP, PAD, MAR, BASS, ARP, STAB, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {EP: 4, PAD: 89, MAR: 12, BASS: 33, ARP: 8, STAB: 81}
events = []


def note(ch, p, start, dur, vel):
    events.append((int(start), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(vel))))))
    events.append((int(start + dur), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, start, dur, vel):
    for p in ps:
        note(ch, p, start, dur, vel)


def cc(ch, c, v, t=0):
    events.append((t, 0, mido.Message("control_change", channel=ch, control=c, value=v)))


def bar(b):
    return b * BAR


def frame_tick(f):
    return f / 30 * BPM / 60 * TPB


E8, E16 = TPB // 2, TPB // 4
CH = {
    "Dm9": (38, [53, 57, 60, 64]),
    "Bbmaj7": (34, [50, 53, 57, 62]),
    "F": (41, [53, 57, 60]),
    "C": (36, [52, 55, 60]),
    "Gm": (43, [55, 58, 62]),
    "A": (45, [57, 61, 64]),
    "Dm": (38, [53, 57, 62]),
    "Bb": (34, [53, 58, 62]),
}
PROG_A = ["Dm9", "Bbmaj7", "F", "C"]
PROG_LOOP = ["Gm", "Dm", "A", "Dm"]
PROG_BRIGHT = ["F", "C", "Bb", "C"]


def ep_bar(b, name, vel=50):
    root, v = CH[name]
    s = bar(b)
    chord(PAD, [p - 12 for p in v[:3]], s, BAR, 40)
    for k, off in enumerate([0, TPB + E8, 2 * TPB + E8]):
        note(EP, v[k % len(v)] + (12 if k == 2 else 0), s + off, TPB * 2, vel - k * 4)
    note(BASS, root, s, BAR - E8, 42)


def marimba_bar(b, name, fig=0, vel=60):
    _, v = CH[name]
    s = bar(b)
    pats = [[0, None, 1, None, 2, None, 1, None], [0, 2, None, 1, None, 2, 1, None], [2, 1, 0, None, 2, None, 1, 0]]
    for k, idx in enumerate(pats[fig]):
        if idx is not None:
            note(MAR, v[idx] + 12, s + k * E8, E8, vel + (10 if k == 0 else 0))


def bass_walk(b, name):
    root, _ = CH[name]
    s = bar(b)
    for k, off in enumerate([0, TPB, 2 * TPB + E8, 3 * TPB]):
        note(BASS, root + [0, 7, 12, 7][k], s + off, E8 + E16, 72 if k == 0 else 58)


def kick(b, pattern="13", vel=70, hats=False):
    s = bar(b)
    for beat in range(4):
        if str(beat + 1) in pattern:
            note(DRUMS, 36, s + beat * TPB, E8, vel)
        if hats:
            note(DRUMS, 42, s + beat * TPB + E8, E16, vel * 0.55)
    if "4" in pattern and "2" in pattern:
        note(DRUMS, 39, s + TPB, E8, vel * 0.6)
        note(DRUMS, 39, s + 3 * TPB, E8, vel * 0.6)


def arp(b, name, vel=46):
    _, v = CH[name]
    s = bar(b)
    seq = v + [v[0] + 12]
    for k in range(8):
        note(ARP, seq[k % len(seq)] + 12, s + k * E8, E16, vel + (k % 4) * 3)


def stab(frame, name="Dm", vel=78):
    _, v = CH[name]
    t = frame_tick(frame)
    chord(STAB, [p + 12 for p in v[:3]], t, E8, vel)
    note(DRUMS, 49, t, TPB, 60)


def w(cue, word):
    c = CUES[cue]
    # word frame estimate: spread inside the cue proportionally (good enough for a music hit)
    n = max(1, c["words"])
    return c["startFrame"] + (c["endFrame"] - c["startFrame"]) * word / n


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {EP: 88, PAD: 64, MAR: 84, BASS: 92, ARP: 60, STAB: 70, DRUMS: 78}.items():
        cc(ch, 7, vol)
    for ch, pan in {MAR: 50, ARP: 82, EP: 46}.items():
        cc(ch, 10, pan)
    for ch in (EP, PAD, MAR, ARP, STAB):
        cc(ch, 91, 72)

    for b in range(NBARS):
        if b < 10:  # hook + promise
            ep_bar(b, PROG_A[b % 4], 48 + (b >= 4) * 4)
            if b >= 4:
                marimba_bar(b, PROG_A[b % 4], 0, 46)
        elif b < 27:  # CH1
            name = PROG_A[b % 4]
            ep_bar(b, name, 44)
            marimba_bar(b, name, 0, 56)
            kick(b, "13", 58)
        elif b < 51:  # CH2
            name = PROG_A[b % 4]
            ep_bar(b, name, 42)
            marimba_bar(b, name, 1, 58)
            bass_walk(b, name)
            kick(b, "13", 62, hats=True)
        elif b < 75:  # CH3 race
            name = PROG_A[b % 4]
            ep_bar(b, name, 40)
            marimba_bar(b, name, 2, 58)
            bass_walk(b, name)
            kick(b, "1234", 60, hats=True)
            if 55 <= b < 66 and b % 2 == 0:
                arp(b, name)
        elif b < 94:  # CH4 loop
            name = PROG_LOOP[b % 4]
            ep_bar(b, name, 40)
            kick(b, "13", 54)
            if b >= 84:
                arp(b, name, 40 + (b - 84) * 2)
        elif b < 109:  # CH5 retrain (bright)
            name = PROG_BRIGHT[b % 4]
            ep_bar(b, name, 46)
            marimba_bar(b, name, 1, 62)
            bass_walk(b, name)
            kick(b, "1234", 62, hats=True)
        elif b < 120:  # recap
            name = PROG_A[b % 4]
            ep_bar(b, name, 44)
            marimba_bar(b, name, 0, 54)
            kick(b, "13", 54, hats=b < 118)
        else:  # end card: back to the opening voicing
            ep_bar(b, PROG_A[b % 4], 46)

    # reveals (neon stabs)
    for fr, nm in [
        (w(2, 1), "Dm"), (w(3, 4), "F"), (w(13, 4), "Bb"), (w(17, 4) + 16, "F"), (w(31, 4), "C"),
        (w(35, 3), "F"), (w(46, 4), "C"), (w(51, 5), "F"), (w(61, 5), "A"), (w(68, 5), "F"), (w(85, 2), "F"),
    ]:
        stab(fr, nm)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "l001-feed-decides.mid")
    mid.save(out)
    print(f"wrote {out} ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
