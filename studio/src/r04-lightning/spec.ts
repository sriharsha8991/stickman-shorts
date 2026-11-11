import type { RealSpec } from "../shared/realcheck";
// R04 · Does lightning never strike the same place twice? Real Check #4, Arm A (Spark as a small reactor). Plan v5.1 (7 lines).
// Facts: facts.md (US National Weather Service "Lightning Myths"; NOAA "5 striking facts versus myths about lightning").
// Photos live in Drive: Photo library / "R04 · Lightning — photos" (doc 1WKO2OtX-RCkpRdkKHraux87iJP4NrxjyGOUnoCLdhcc);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R04",
  slug: "r04-lightning",
  n: 4,
  bg: "#4b2a7b",
  accent: "#8ef6ff",
  overlay: "NEVER TWICE?",
  spark: true,
  photos: [
    { file: "tower.jpg", credit: "Matt Biddulph, CC BY-SA 2.0 (Flickr)", focus: [0.5, 0.68], zoom: [1.0, 1.08] },
    // caption text at the bottom of the 1934 print stays out of frame
    { file: "esb.jpg", credit: "John P. Gaty 1934 / NOAA, public domain", focus: [0.45, 0.52], zoom: [1.05, 1.15] },
    { file: "cn.jpg", credit: "Raul Heinrich, CC BY-SA 3.0 (Wikimedia Commons)", focus: [0.5, 0.35], zoom: [1.0, 1.1] },
    { file: "tree.jpg", credit: "Infrogmation of New Orleans, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.6, 0.3], zoom: [1.0, 1.1] },
    { file: "tower.jpg", credit: "Matt Biddulph, CC BY-SA 2.0 (Flickr)", focus: [0.5, 0.62], zoom: [1.15, 1.3] },
    { file: "city.jpg", credit: "Tree Leaf Clover, CC BY 2.0 (Flickr)", focus: [0.6, 0.55], zoom: [1.0, 1.1] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Do you believe lightning never strikes one place twice? Why?
    { show: { photo: 1 }, tag: "23 A YEAR", mood: "shock", gesture: "recoil" }, // The Empire State Building is hit about twenty-three times a year.
    { show: { photo: 2 }, tag: "AGAIN AND AGAIN", mood: "neutral", gesture: "pointSide" }, // Tall towers get hit again and again.
    { show: { photo: 3 }, tag: "TREES TOO", mood: "curious", gesture: "present" }, // Trees get struck many times a year.
    { show: { photo: 4 }, mood: "smug", gesture: "handsHips" }, // That saying is a myth!
    { show: { photo: 5 }, tag: "GO INDOORS", mood: "happy", gesture: "pointDown" }, // Hear thunder? Go indoors, not under a tree.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Have you seen lightning up close?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["twice?", "twenty-three", "again.", "Trees", "myth!", "indoors,", "close?"],
};
