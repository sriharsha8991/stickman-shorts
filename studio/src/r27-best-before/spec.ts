import type { RealSpec } from "../shared/realcheck";
// R27 · Is food bad after its best-before date? Real Check #27, Arm A (Spark reactor). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (USDA FSIS "Food Product Dating"; FDA "Working with the Food Industry to Reduce Confusion Over Date Labels";
// Codex CXS 1-1985 §2; FSANZ "Best-before and use-by dates"; read 16 Nov 2026).
// Photos live in Drive: Photo library / "R27 · Is food bad after its best-before date? — photos" (doc 1AfPjt4VYPb67STx_kiNts_3jyVrHjh7zM32SsTGY4Eg);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R27",
  slug: "r27-best-before",
  n: 27,
  bg: "#8c5a3c",
  accent: "#e9ff70",
  overlay: "BEST BEFORE = BAD?",
  spark: true,
  photos: [
    { file: "datestamp.jpg", credit: "KSRE Photo, CC BY 2.0 (Flickr)", focus: [0.62, 0.8], zoom: [1.0, 1.06] },
    { file: "quality.jpg", credit: "waitscm, CC BY 2.0 (Flickr)", focus: [0.55, 0.42], zoom: [1.05, 1.15] },
    { file: "pantry.jpg", credit: "chispita_666, CC BY 2.0 (Flickr)", focus: [0.12, 0.6], zoom: [1.25, 1.32] },
    { file: "wastebin.jpg", credit: "rjw1, CC BY-SA 2.0 (Flickr)", focus: [0.55, 0.45], zoom: [1.0, 1.08] },
    { file: "datestamp.jpg", credit: "KSRE Photo, CC BY 2.0 (Flickr)", focus: [0.42, 0.62], zoom: [1.15, 1.25] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Do dates make you waste your food before it's bad?
    { show: { photo: 1 }, tag: "QUALITY, NOT SAFETY", mood: "neutral", gesture: "pointSide" }, // US agencies say it's about quality, not safety.
    { show: { photo: 2 }, tag: "STILL SAFE", mood: "happy", gesture: "present" }, // Stored well, it's safe, just less fresh.
    { show: { photo: 3 }, tag: "ABOUT A FIFTH", mood: "shock", gesture: "recoil" }, // Mix-ups cause about a fifth of home food waste.
    { show: { photo: 4 }, mood: "smug", gesture: "handsHips" }, // Bad the next day? Myth!
    { show: { card: "USE BY = SAFETY", sub: "MEAT · FISH · READY MEALS · NEVER GO PAST IT" }, mood: "angry", gesture: "stop" }, // Use-by dates are different. Never go past those.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // What have you binned because of a date?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["waste", "quality,", "safe,", "fifth", "Myth!", "Never", "date?"],
};
