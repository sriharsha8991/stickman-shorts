#!/usr/bin/env python3
"""Score for V014 "Why payment apps give you scratch cards" (v014-scratch-card).

Lo-fi keys + marimba, 120 BPM (bar = 2 s), 14 bars = 28 s (retention v2 cut), D dorian. Sparse under the voice.
  bars 0-2   hook        Rhodes Dm9 / Bbmaj7, soft shaker; a "thud" accent at 4.5 s (BETTER LUCK)
  bars 3-5   some pay    marimba off-beat plucks + round bass
  bars 6-9   pigeon lab  (12.5 s) pizzicato ostinato + rim/kick, crash on entry; muted at 19.8 s ("stopped")
  bars 10-14 rules       pad + bass only (tension), riser into the hook hit
  bar 14.8   THE HOOK    (29.5 s) crash + glockenspiel bloom
  bars 15-17 payoff/loop F / C bright, last bar returns to Dm9 (loops to bar 0)
"""
import os
import mido

TPB = 480
BAR = TPB * 4
HERE = os.path.dirname(os.path.abspath(__file__))
RHODES, PAD, MARIMBA, BASS, GLOCK, PIZZ, DRUMS = 0, 1, 2, 3, 4, 5, 9
PROGRAMS = {RHODES: 4, PAD: 88, MARIMBA: 12, BASS: 32, GLOCK: 9, PIZZ: 45}
events = []


def note(ch, p, s, d, v):
    events.append((int(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((int(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def chord(ch, ps, s, d, v):
    for p in ps:
        note(ch, p, s, d, v)


def cc(ch, c, val, t=0):
    events.append((t, 0, mido.Message("control_change", channel=ch, control=c, value=val)))


def bar(b):
    return int(b * BAR)


def sec(t):
    return int(t / 2.0 * BAR)


E8, E16 = TPB // 2, TPB // 4
CH = {
    "Dm9": (38, [53, 57, 60, 64]),
    "Bbmaj7": (34, [53, 57, 62, 65]),
    "Gm7": (43, [53, 58, 62, 65]),
    "C": (36, [55, 60, 64]),
    "F": (41, [53, 57, 60, 65]),
    "Am7": (45, [55, 60, 64, 67]),
}


def keys(b, name, v=48):
    root, vo = CH[name]
    s = bar(b)
    chord(PAD, [p - 12 for p in vo[:3]], s, BAR, 34)
    for k, off in enumerate([0, TPB + E8, 3 * TPB]):
        note(RHODES, vo[k % len(vo)], s + off, TPB * 2, v - k * 4)
    note(BASS, root, s, BAR - E8, 46)


def shaker(b, v=34):
    for k in range(8):
        note(DRUMS, 70, bar(b) + k * E8, E16, v + (8 if k % 2 else 0))


def marimba(b, name):
    _, vo = CH[name]
    for k, idx in [(1, 0), (3, 2), (6, 1)]:
        note(MARIMBA, vo[idx] + 12, bar(b) + k * E8, E8, 60)


def pizz(b, name, kick=True):
    root, vo = CH[name]
    s = bar(b)
    for k in range(8):
        note(PIZZ, vo[[0, 2, 1, 2][k % 4]], s + k * E8, E8, 56 if k % 2 == 0 else 44)
    if kick:
        note(DRUMS, 36, s, E8, 70)
        note(DRUMS, 36, s + 2 * TPB + E8, E8, 56)
        note(DRUMS, 37, s + TPB, E8, 50)
        note(DRUMS, 37, s + 3 * TPB, E8, 50)
    note(BASS, root, s, TPB, 54)
    note(BASS, root, s + 2 * TPB, TPB, 48)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {RHODES: 90, PAD: 66, MARIMBA: 92, BASS: 96, GLOCK: 74, PIZZ: 84, DRUMS: 84}.items():
        cc(ch, 7, vol)
    for ch, pan in {MARIMBA: 44, GLOCK: 84, PIZZ: 74, RHODES: 54}.items():
        cc(ch, 10, pan)
    for ch in (RHODES, PAD, MARIMBA, GLOCK, PIZZ):
        cc(ch, 91, 64)

    # retention v2 cut (26.8 s, 14 bars). Hits: 0.4 s impact, 3.4 s thud (₹0 again), 6.9 s BY DESIGN,
    # 11.0 s pigeon lab, 16.3 s "longest" (drop out), 17.6 s SLOT MACHINE hit, 23.5 s payoff, bar 13 loops to bar 0.
    note(DRUMS, 49, sec(0.4), TPB, 88)
    note(DRUMS, 36, sec(0.4), E8, 92)
    for b, n in zip(range(0, 2), ["Dm9", "Bbmaj7"]):
        keys(b, n)
        shaker(b, 28)
    note(DRUMS, 36, sec(3.43), E8, 84)
    note(BASS, 33, sec(3.43), TPB, 70)
    note(DRUMS, 49, sec(6.9), TPB, 78)
    for b, n in zip(range(2, 5), ["Gm7", "Dm9", "Bbmaj7"]):
        keys(b, n, 44)
        marimba(b, n)
        shaker(b, 30)
    note(DRUMS, 49, sec(11.0), TPB, 82)
    for b, n in zip(range(5, 8), ["Dm9", "Gm7", "Dm9"]):
        pizz(b, n, kick=(b != 5))
        chord(PAD, [p - 12 for p in CH[n][1][:3]], bar(b), BAR, 30)
    # bar 8: 16.0-18 s: silence after "longest", riser glock into the slot hit
    for k in range(5):
        note(GLOCK, [69, 72, 74, 77, 81][k], sec(16.4) + k * E16, E8, 44 + k * 7)
    h = sec(17.57)
    note(DRUMS, 49, h, TPB * 2, 98)
    note(DRUMS, 36, h, E8, 98)
    for k, p in enumerate([77, 81, 84, 89]):
        note(GLOCK, p, h + k * E16, TPB, 78)
    for b, n in zip(range(9, 11), ["Am7", "C"]):
        root, vo = CH[n]
        chord(PAD, [p - 12 for p in vo[:3]], bar(b), BAR, 40)
        note(BASS, root, bar(b), BAR - E8, 50)
    for b, n in zip(range(11, 13), ["F", "C"]):
        keys(b, n, 52)
        marimba(b, n)
        shaker(b, 30)
    note(DRUMS, 49, sec(23.5), TPB, 70)
    keys(13, "Dm9", 44)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(120), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "v014-scratch-card.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
