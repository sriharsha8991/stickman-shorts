import type { RealSpec } from "../shared/realcheck";
// R22 · Do blue-light glasses really protect your eyes? Real Check #22, Arm B (no Spark). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Singh et al. 2023, Cochrane Database of Systematic Reviews CD013244.pub2; American Academy of Ophthalmology).
// Photos live in Drive: Photo library / "R22 · Blue-light glasses — photos" (doc 163XSdyquVNwG1GcIAo8GCUgDPeU87-lBqlBTi4avC2A);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R22",
  slug: "r22-blue-light-glasses",
  n: 22,
  bg: "#0d1b2a",
  accent: "#ffb703",
  overlay: "BLUE-LIGHT GLASSES?",
  spark: false,
  photos: [
    { file: "glasses.jpg", credit: "Sevayuu, CC BY 4.0 (Wikimedia Commons)", focus: [0.5, 0.5], zoom: [1.05, 1.14] },
    { file: "pcglasses.jpg", credit: "masayukig, CC BY 2.0 (Flickr)", focus: [0.5, 0.48], zoom: [1.14, 1.24] },
    { file: "sky.jpg", credit: "iezalel williams, CC0 (Flickr)", focus: [0.32, 0.42], zoom: [1.05, 1.15] },
    { file: "glasses.jpg", credit: "Sevayuu, CC BY 4.0 (Wikimedia Commons)", focus: [0.28, 0.5], zoom: [1.35, 1.48] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Blue-light glasses? Before you buy, do they work? Why?
    { show: { card: "17 TRIALS", sub: "6 COUNTRIES · COCHRANE REVIEW 2023" }, mood: "neutral", gesture: "pointSide" }, // Seventeen trials tested these glasses.
    { show: { photo: 1 }, tag: "NO CLEAR HELP", mood: "shock", gesture: "recoil" }, // They probably didn't help tired eyes.
    { show: { photo: 2 }, tag: "SUN WINS", mood: "curious", gesture: "present" }, // Sunlight has far more blue light than screens.
    { show: { photo: 3 }, mood: "smug", gesture: "handsHips" }, // Protecting your eyes? A myth!
    { show: { card: "BLINK MORE", sub: "EVERY 20 MIN · LOOK 20 FT AWAY · 20 S" }, mood: "happy", gesture: "pointDown" }, // Screens tire your eyes because you blink less. Look away often.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Do you own a pair of blue-light glasses?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["glasses?", "Seventeen", "tired", "Sunlight", "myth!", "blink", "own"],
};
