import type { RealSpec } from "../shared/realcheck";
// R37 · Never restart your phone? Are you making hacking easier? Real Check #37, Arm A (Spark reactor). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (NSA "Mobile Device Best Practices", PP-20-0622, Oct 2020 rev 1.1: "Power the device off and on weekly";
// Amnesty International, "Forensic Methodology Report: How to Catch NSO Group's Pegasus" (Jul 2021): "Pegasus is no longer
// maintaining persistence on iOS devices", payloads "not recoverable from the non-volatile filesystem"; the same NSA guide
// says update software and apps as soon as possible; verified 19 Nov 2026).
// Photos live in Drive: Photo library / "R37 · Restarting your phone — photos" (doc 1DhidYTiGGSK00pSQZlqgaLe8AWuJnsEoWmZ2O18-Qi0);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R37",
  slug: "r37-restart-phone",
  n: 37,
  bg: "#c1121f",
  accent: "#ffd166",
  overlay: "NEVER RESTART?",
  spark: true,
  photos: [
    { file: "phone_off.jpg", credit: "CCØBAY, CC0 (Flickr)", focus: [0.55, 0.5], zoom: [1.0, 1.08] },
    { file: "innards.jpg", credit: "Mrs. Gemstone, CC BY-SA 2.0 (Flickr)", focus: [0.5, 0.5], zoom: [1.0, 1.1] },
    { file: "phone_off.jpg", credit: "CCØBAY, CC0 (Flickr)", focus: [0.53, 0.45], zoom: [1.2, 1.28] },
    { file: "phone_use.jpg", credit: "Archeduc - Vormingplus Halle-Vilvoorde, CC0 (Flickr)", focus: [0.58, 0.5], zoom: [1.0, 1.08] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Never restart your phone? Are you making hacking easier?
    { show: { card: "RESTART WEEKLY", sub: "NSA phone guide, 2020" }, mood: "neutral", gesture: "pointSide" }, // The NSA's advice: restart your phone weekly.
    { show: { photo: 1 }, tag: "LIVES IN MEMORY", mood: "shock", gesture: "present" }, // Some spy tools live only in memory.
    { show: { split: [{ label: "BEFORE RESTART", text: "IN MEMORY" }, { label: "AFTER RESTART", text: "WIPED" }] }, mood: "shock", gesture: "recoil" }, // A restart wipes them right out.
    { show: { photo: 2 }, mood: "smug", gesture: "handsHips" }, // So do restarts help? True!
    { show: { photo: 3 }, tag: "UPDATE TOO", mood: "neutral", gesture: "pointDown" }, // It is no cure, so keep your phone updated too.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // When did you last restart your phone?
  ],
  verdict: "TRUE",
  verdictAt: [4, 4],
  hi: ["hacking", "weekly.", "memory.", "wipes", "True!", "updated", "restart"],
};
