import type { RealSpec } from "../shared/realcheck";
// R03 · Does shaving make hair grow back thicker? Real Check #3, Arm A (Spark as a small reactor). Plan v5.1 (7 lines).
// Facts: facts.md (Lynfield & MacWilliams 1970, J Invest Dermatol 55:170-2; Trotter 1928, Anat Rec 37:373-9; Mayo Clinic).
// Photos live in Drive: Photo library / "R03 · Shaving and hair — photos" (doc 1qLbcY7OrcVYe5_K4t-M_fhAQSGOz6QuJ7Q35Zmn-5TE);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R03",
  slug: "r03-shaving",
  n: 3,
  bg: "#2e3a8c",
  accent: "#ffc93c",
  overlay: "SHAVE = THICKER?",
  spark: true,
  photos: [
    { file: "razor.jpg", credit: "worak, CC BY 2.0 (Flickr)", focus: [0.35, 0.5], zoom: [1.05, 1.15] },
    // cropped to the leg and razor; the person's face (right edge) stays out of frame
    { file: "shaving.jpg", credit: "Betsssssy, CC BY 2.0 (Flickr)", focus: [0.2, 0.32], zoom: [1.5, 1.6] },
    { file: "unshaved.jpg", credit: "nigelpepper, CC BY 2.0 (Flickr)", focus: [0.45, 0.6], zoom: [1.0, 1.1] },
    { file: "micro.jpg", credit: "Arlo James Barnes, CC0 (Wikimedia Commons)", focus: [0.5, 0.28], zoom: [1.3, 1.38] },
    { file: "micro.jpg", credit: "Arlo James Barnes, CC0 (Wikimedia Commons)", focus: [0.45, 0.3], zoom: [1.35, 1.6] },
    { file: "stubble.jpg", credit: "Musicaloris, CC BY 2.0 (Flickr)", focus: [0.55, 0.55], zoom: [1.05, 1.2] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Before you shave again, does hair grow back thicker? Why?
    { show: { photo: 1 }, tag: "ONE LEG SHAVED", mood: "neutral", gesture: "pointSide" }, // Researchers shaved one leg of five men, every week.
    { show: { photo: 2 }, tag: "NEVER SHAVED", mood: "curious", gesture: "present" }, // The other leg was never shaved.
    { show: { photo: 3 }, tag: "JUST AS THIN", mood: "shock", gesture: "recoil" }, // Both legs grew hair just as thin.
    { show: { photo: 4 }, mood: "smug", gesture: "handsHips" }, // So thicker hair is a myth!
    { show: { photo: 5 }, tag: "BLUNT TIP", mood: "happy", gesture: "pointDown" }, // A razor leaves a blunt tip, so stubble feels rough.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Who told you this one?
  ],
  verdict: "MYTH",
  verdictAt: [4, 5],
  hi: ["thicker?", "one", "never", "thin.", "myth!", "blunt", "told"],
};
