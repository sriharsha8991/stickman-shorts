#!/usr/bin/env python3
"""Score for H03 "One-minute huffing bursts" (h03-huff-bursts).

Chiptune-flavoured pulse, 128 BPM (bar = 1.875 s), 21 bars ≈ 39 s, E major. Square lead + synth bass + tight kit.
  bars 0-1   hook          square-wave stabs on E / C#m, no drums (3 MINUTES. NO GYM.)
  bars 2-5   trackers      soft synth-bass pulse + hats, blip counter at 25,241
  bars 6-9   LEVELS        (12.2 s) full chip groove: kick/snare, 16th arps (energy between lines)
  riser -> 19.4 s          "forty percent" hit (crash + low boom), 22.0 s second hit ("half")
  bars 12-15 caveat        drums out, pad + bass, minor colour (C#m / A)
  31.5 s     BOSS LEVELS   crash + fanfare arp, groove returns
  35.8 s     LEVEL ONE     coin chime; last bar loops into the hook stabs
"""
import os
import mido

TPB = 480
BAR = TPB * 4
BPM = 128
SPB = 60 / BPM * 4
HERE = os.path.dirname(os.path.abspath(__file__))
LEAD, BASS, PAD, ARP, DRUMS = 0, 1, 2, 3, 9
PROGRAMS = {LEAD: 80, BASS: 38, PAD: 90, ARP: 81}
events = []


def note(ch, p, s, d, v):
    events.append((int(s), 1, mido.Message("note_on", channel=ch, note=p, velocity=max(1, min(127, int(v))))))
    events.append((int(s + d), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))


def cc(ch, c, val, t=0):
    events.append((t, 0, mido.Message("control_change", channel=ch, control=c, value=val)))


def bar(b):
    return int(b * BAR)


def sec(t):
    return int(t / SPB * BAR)


E8, E16 = TPB // 2, TPB // 4
CH = {"E": (40, [64, 68, 71]), "C#m": (37, [61, 64, 68]), "A": (33, [61, 64, 69]), "B": (35, [63, 66, 71])}


def stabs(b, name, v=84):
    _, vo = CH[name]
    for off in (0, 3 * E8):
        for p in vo:
            note(LEAD, p, bar(b) + off, E8, v)


def pulse(b, name, v=50):
    root, _ = CH[name]
    for k in range(8):
        note(BASS, root + (12 if k % 2 else 0), bar(b) + k * E8, E8 - 20, v)


def hats(b, v=36):
    for k in range(8):
        note(DRUMS, 42, bar(b) + k * E8, E16, v + (10 if k % 2 == 0 else 0))


def kit(b, crash=False):
    s = bar(b)
    if crash:
        note(DRUMS, 49, s, TPB, 90)
    for beat in range(4):
        note(DRUMS, 36 if beat % 2 == 0 else 38, s + beat * TPB, E8, 92 if beat % 2 == 0 else 78)
    hats(b, 40)


def arp(b, name, v=46, oct=12):
    _, vo = CH[name]
    seq = vo + [vo[0] + 12]
    for k in range(16):
        if k % 4 == 3:
            continue  # leave gaps for the voice
        note(ARP, seq[k % 4] + oct, bar(b) + k * E16, E16, v)


def main():
    for ch, prog in PROGRAMS.items():
        events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))
    for ch, vol in {LEAD: 124, BASS: 92, PAD: 64, ARP: 70, DRUMS: 88}.items():
        cc(ch, 7, vol)
    cc(ARP, 10, 84)
    cc(LEAD, 10, 50)
    for ch in (PAD, ARP, LEAD):
        cc(ch, 91, 50)

    # retention-v2 cut (29 s): hits at 0.27 s (dash), 17.0 s (forty), 20.6 s (half), 26.7 s (today)
    note(DRUMS, 49, sec(0.27), TPB, 96)
    note(DRUMS, 36, sec(0.27), E8, 104)
    for b, n in [(0, "E"), (1, "C#m")]:
        stabs(b, n)
        pulse(b, n, 40)
    for b, n in [(2, "A"), (3, "B")]:  # open loop -> levels (7.2 s = bar 3.8)
        pulse(b, n, 46)
        hats(b, 30)
    for i, b in enumerate(range(4, 8)):  # levels + trackers, full chip groove
        n = ["E", "B", "C#m", "A"][i]
        pulse(b, n, 54)
        kit(b, crash=(i == 0))
        arp(b, n, 42)
    for b, n in zip(range(8, 11), ["C#m", "B", "E"]):  # under the numbers: pulse + hats only
        pulse(b, n, 42)
        hats(b, 28)
    hit = sec(17.0)
    for k in range(12):
        note(ARP, 64 + k * 2, hit - 12 * E16 + k * E16, E16, 40 + k * 4)
    note(DRUMS, 49, hit, TPB * 2, 100)
    note(DRUMS, 36, hit, E8, 110)
    note(BASS, 28, hit, BAR, 80)
    h2 = sec(20.63)
    note(DRUMS, 49, h2, TPB, 80)
    note(DRUMS, 36, h2, E8, 96)
    for b, n in zip(range(11, 13), ["C#m", "B"]):  # caveat: quiet
        root, vo = CH[n]
        for p in vo:
            note(PAD, p - 12, bar(b), BAR, 40)
        note(BASS, root, bar(b), BAR - E8, 46)
    boss = sec(26.7)
    note(DRUMS, 49, boss, TPB * 2, 104)
    for k, p in enumerate([64, 68, 71, 76, 80, 83]):
        note(LEAD, p, boss + k * E16, E8, 70)
    pulse(13, "A", 50)
    kit(13)
    stabs(14, "E", 52)
    pulse(14, "E", 40)
    stabs(15, "C#m", 52)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    last = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        tr.append(msg.copy(time=tick - last))
        last = tick
    out = os.path.join(HERE, "h03-huff-bursts.mid")
    mid.save(out)
    print(f"wrote {out}  ({mid.length:.1f} s)")


if __name__ == "__main__":
    main()
