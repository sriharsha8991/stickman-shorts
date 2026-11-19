# R37 · Never restart your phone? Are you making hacking easier? — facts (verified 19 Nov 2026)

Verdict: **TRUE**. The US National Security Agency's public phone guide tells users to power the phone off and on every
week, because some phone spyware is not "persistent": it lives only in working memory and does not survive a restart, so
the attacker has to break in again. A restart is not a cure: persistent malware, bad apps and scam links are not fixed by
it, so the same guide also says to install updates quickly.

| Line | Claim | Verdict | Source |
|---|---|---|---|
| 1 | Never restart your phone? Are you making hacking easier? | Question | — |
| 2 | The NSA's advice: restart your phone weekly. (card: RESTART WEEKLY · NSA phone guide, 2020) | True | National Security Agency, "Mobile Device Best Practices" (PP-20-0622, Oct 2020, rev 1.1): "Power the device off and on weekly." https://media.defense.gov/2021/Sep/16/2002855921/-1/-1/0/MOBILE_DEVICE_BEST_PRACTICES_FINAL_V3%20-%20COPY.PDF (read 19 Nov 2026; the guide's chart legend grades each step as "almost always prevents" or "sometimes prevents", i.e. no single step is a full fix) |
| 3 | Some spy tools live only in memory. | True | Amnesty International Security Lab, "Forensic Methodology Report: How to Catch NSO Group's Pegasus" (July 2021): "Pegasus is no longer maintaining persistence on iOS devices"; its payloads "are not recoverable from the non-volatile filesystem", one would need "to extract payloads from memory". https://www.amnesty.org/en/wp-content/uploads/2021/08/DOC1044872021ENGLISH.pdf |
| 4 | A restart wipes them right out. (split: BEFORE RESTART in memory / AFTER RESTART wiped) | True | Same report: a non-persistent implant is not stored on the phone's storage, so a reboot clears it (the report notes extraction would need a jailbreak "without reboot"); the attacker has to infect the phone again. |
| 5 | So do restarts help? True! | True | Lines 2-4 (NSA advice + non-persistent spyware). |
| 6 | It is no cure, so keep your phone updated too. | True | Same NSA guide: "Update the device software and applications as soon as possible"; also "DO NOT open unknown email attachments and links". |
| 7 | When did you last restart your phone? | Question | — |

Plain-words caveat: most people are never targeted by spyware like Pegasus; a weekly restart is a cheap extra layer, not
protection on its own. Updates, app store apps only, and not tapping strange links matter more.

## Photo credits (all pulled from the Drive Photo library doc 1DhidYTiGGSK00pSQZlqgaLe8AWuJnsEoWmZ2O18-Qi0)
- phone_off.jpg: "smartphone-in-hand-mockup" · CCØBAY · CC0 1.0 · https://www.flickr.com/photos/151198978@N08/31572507974
- innards.jpg: "Phone Innards with Gunk" · Mrs. Gemstone · CC BY-SA 2.0 · https://www.flickr.com/photos/21893264@N00/5303007201
- phone_use.jpg: "smartphone-foto-hand-bos-herfst-wide_unsplash" · Archeduc - Vormingplus Halle-Vilvoorde · CC0 1.0 · https://www.flickr.com/photos/26346696@N02/29794402404
