import type { RealSpec } from "../shared/realcheck";
// R23 · Does dark mode really save your phone's battery? Real Check #23, Arm A (Spark reactor). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Purdue University news release 28 Jul 2021 on Dash & Hu, ACM MobiSys 2021).
// Photos live in Drive: Photo library / "R23 · Dark mode and battery — photos" (doc 1WaVuPvU_fJano7JkNM6tC1Eqq0YPfq6UI6uc8sLsRTc);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R23",
  slug: "r23-dark-mode",
  n: 23,
  bg: "#3a0ca3",
  accent: "#f72585",
  overlay: "DARK MODE = BATTERY?",
  spark: true,
  photos: [
    { file: "sun.jpg", credit: "Shixart1985, CC BY 2.0 (Wikimedia Commons)", focus: [0.58, 0.24], zoom: [1.0, 1.08] },
    { file: "white.jpg", credit: "Santeri Viinamäki, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.47, 0.42], zoom: [1.1, 1.2] },
    { file: "oled.jpg", credit: "TECH EDU, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.5, 0.5], zoom: [1.05, 1.16] },
    { file: "sun.jpg", credit: "Shixart1985, CC BY 2.0 (Wikimedia Commons)", focus: [0.62, 0.22], zoom: [1.2, 1.3] },
    { file: "sun.jpg", credit: "Shixart1985, CC BY 2.0 (Wikimedia Commons)", focus: [0.5, 0.3], zoom: [1.0, 1.06] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Dark mode? Before you trust it, does it save battery?
    { show: { card: "4 PHONES", sub: "PURDUE UNIVERSITY TEST · 2021" }, mood: "neutral", gesture: "pointSide" }, // Purdue engineers tested four phones.
    { show: { photo: 3 }, tag: "SAVED ~40%", mood: "shock", gesture: "recoil" }, // At full brightness, it saved about forty percent.
    { show: { photo: 1 }, tag: "ONLY 3–9%", mood: "curious", gesture: "present" }, // Indoors, it saved just three to nine percent.
    { show: { photo: 4 }, mood: "smug", gesture: "handsHips" }, // Battery saver? Only half true!
    { show: { photo: 2 }, tag: "OLED ONLY", mood: "happy", gesture: "pointDown" }, // It only works on screens whose black pixels switch off.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Is your phone in dark mode right now?
  ],
  verdict: "HALF TRUE",
  verdictAt: [4, 3],
  hi: ["battery?", "four", "forty", "three", "true!", "black", "right"],
};
