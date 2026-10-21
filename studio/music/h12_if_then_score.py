#!/usr/bin/env python3
"""Score for H12 · The if-then trick.

Curious -> build -> reveal, lo-fi: Rhodes + muted guitar + warm pad + lo-fi kit, 112 BPM (no marimba, so it
sounds nothing like V009's pizzicato/marimba bounce). 1 bar = 2.143 s, 18 bars ≈ 38.6 s (voice 37.7 s).
  bars 0-3   the 7 AM fight     Am7 / Dm7 Rhodes, soft kick + rim, a sagging slide on "snooze wins" (bar 3.8)
  bars 4-7   the fix + dominoes muted-guitar ostinato + shaker, rising; three domino knocks at 16.4-16.9 s
  bars 8-14  aha + proof        bright major lo-fi groove Cmaj7 G Am Fmaj7, Rhodes stabs in the gaps
  bars 15-17 caveat + loop      drums out, Rhodes Am7 → Dm7 → Am7 (loops into bar 0)
"""
import os
import mido

TPB = 480
BAR = TPB * 4
E8, E16 = TPB // 2, TPB // 4
BPM = 112
HERE = os.path.dirname(os.path.abspath(__file__))
RHODES, GTR, PAD, BASS, BELL, DRUMS = 0, 1, 2, 3, 4, 9
PROGRAMS = {RHODES: 4, GTR: 28, PAD: 89, BASS: 33, BELL: 11}
events = []


def note(ch, p, s, d, v):
    s = int(s)
    events.append((s, 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((s + int(d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def cc(ch, c, v, t=0):
    events.append((t, 0, mido.Message("control_change", channel=ch, control=c, value=v)))


def bar(b):
    return int(b * BAR)


def sec(s):
    return int(s / (60 / BPM) * TPB)


CH = {
    "Am7": (45, [57, 60, 64, 67]), "Dm7": (50, [53, 57, 60, 65]), "Em7": (52, [55, 59, 62, 64]),
    "Fmaj7": (41, [53, 57, 60, 64]), "Cmaj7": (48, [55, 59, 60, 64]), "G": (43, [55, 59, 62]), "Am": (45, [57, 60, 64]),
}


def rhodes_bar(b, name, v=52):
    root, vo = CH[name]
    s = bar(b)
    for p in vo:
        note(RHODES, p, s, BAR - E8, v)
    note(BASS, root - 12 if root > 47 else root, s, TPB * 3, v + 8)


def kit(b, soft=1.0, shaker=False, full=False):
    s = bar(b)
    for k in range(4):
        t = s + k * TPB
        if k in (0, 2) or (full and k == 2):
            note(DRUMS, 36, t, E8, 78 * soft)
        if k in (1, 3):
            note(DRUMS, 37 if not full else 38, t, E8, (60 if not full else 70) * soft)
        if shaker or full:
            note(DRUMS, 70, t, E16, 40 * soft)
            note(DRUMS, 70, t + E8, E16, 30 * soft)
    if full:
        note(DRUMS, 36, s + 2 * TPB + E8, E16, 60 * soft)


def gtr_ostinato(b, name, rise=0):
    _, vo = CH[name]
    s = bar(b)
    pat = [0, 2, 1, 2, 0, 3 % len(vo), 1, 2]
    for k, i in enumerate(pat):
        note(GTR, vo[i] + rise, s + k * E8, E8 - 40, 52 + k % 2 * 8)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {RHODES: 96, GTR: 84, PAD: 60, BASS: 96, BELL: 70, DRUMS: 80}.items():
        cc(ch, 7, vol)
    for ch in (RHODES, PAD, BELL, GTR):
        cc(ch, 91, 70)
    cc(GTR, 10, 40)
    cc(BELL, 10, 86)

    # bars 0-3: the fight
    for b, name in enumerate(["Am7", "Dm7", "Am7", "Dm7"]):
        rhodes_bar(b, name, 46)
        kit(b, 0.7)
    for k, p in enumerate([64, 63, 62, 61, 60]):  # sag on "snooze wins"
        note(RHODES, p + 12, sec(8.2) + k * E16, E8, 56 - k * 4)
    # bars 4-7: the fix, building
    for i, name in enumerate(["Fmaj7", "G", "Am7", "Em7"]):
        b = 4 + i
        rhodes_bar(b, name, 42)
        gtr_ostinato(b, name, 12 if i >= 2 else 0)
        kit(b, 0.75 + i * 0.06, shaker=True)
        for p in CH[name][1][:3]:
            note(PAD, p - 12, bar(b), BAR, 34 + i * 4)
    for k, t in enumerate([16.4, 16.6, 16.85]):  # domino knocks
        note(DRUMS, 76 + (k % 2), sec(t), E16, 90)
        note(BELL, 72 + k * 4, sec(t), E8, 70)
    # bars 8-14: aha + proof (bright)
    prog = ["Cmaj7", "G", "Am", "Fmaj7", "Cmaj7", "G", "Fmaj7"]
    for i, name in enumerate(prog):
        b = 8 + i
        root, vo = CH[name]
        kit(b, 0.85, full=True)
        note(BASS, root - 12 if root > 47 else root, bar(b), E8 * 3, 74)
        note(BASS, (root - 12 if root > 47 else root) + 7, bar(b) + 2 * TPB + E8, E8, 64)
        for off in (TPB + E8, 3 * TPB):
            for p in vo:
                note(RHODES, p, bar(b) + off, E8, 48)
        for p in vo[:3]:
            note(PAD, p, bar(b), BAR, 32)
    note(DRUMS, 49, sec(19.6), TPB * 2, 70)  # aha
    for k, p in enumerate([72, 76, 79, 84]):
        note(BELL, p, sec(19.6) + k * E16, E8, 66)
    note(DRUMS, 49, sec(26.1), TPB * 2, 84)  # 91%
    # bars 15-17: caveat + loop
    for b, name in zip((15, 16, 17), ["Am7", "Dm7", "Am7"]):
        rhodes_bar(b, name, 44)
        kit(b, 0.55)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for t, _, m in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(m.copy(time=t - last))
        last = t
    out = os.path.join(HERE, "h12-if-then.mid")
    mid.save(out)
    print(f"wrote {out} ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
