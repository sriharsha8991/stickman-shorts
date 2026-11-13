import type { RealSpec } from "../shared/realcheck";
// R19 · Is food safe on the floor for five seconds? Real Check #19, Arm A (Spark reactor). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Miranda & Schaffner 2016, Applied and Environmental Microbiology, doi:10.1128/AEM.01838-16).
// Photos live in Drive: Photo library / "R19 · The five-second rule — photos" (doc 1BHcoph9-xuxTQtyNWxpgHNOLxtAbyiszP1Xuu6hDuvQ);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R19",
  slug: "r19-five-second",
  n: 19,
  bg: "#3d5a1e",
  accent: "#ff6b6b",
  overlay: "5-SECOND RULE?",
  spark: true,
  photos: [
    { file: "toast.jpg", credit: "EgoVolo, CC BY-SA 3.0 (Wikimedia Commons)", focus: [0.45, 0.5], zoom: [1.05, 1.14] },
    { file: "agar.jpg", credit: "HansN., CC BY-SA 3.0 (Wikimedia Commons)", focus: [0.5, 0.5], zoom: [1.0, 1.12] },
    { file: "melon.jpg", credit: "John Phelan, CC BY-SA 3.0 (Wikimedia Commons)", focus: [0.55, 0.5], zoom: [1.05, 1.15] },
    { file: "carpet.jpg", credit: "Kurt Kaiser, CC0 (Wikimedia Commons)", focus: [0.5, 0.5], zoom: [1.0, 1.06] },
    { file: "toast.jpg", credit: "EgoVolo, CC BY-SA 3.0 (Wikimedia Commons)", focus: [0.4, 0.45], zoom: [1.3, 1.42] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Dropped food? Before you eat it, is five seconds safe?
    { show: { card: "2,560", sub: "TESTS · RUTGERS UNIVERSITY, 2016" }, mood: "shock", gesture: "recoil" }, // Scientists ran over two thousand drop tests.
    { show: { photo: 1 }, tag: "UNDER 1 SECOND", mood: "neutral", gesture: "pointSide" }, // Germs moved onto food in under one second.
    { show: { photo: 2 }, tag: "MOST GERMS", mood: "curious", gesture: "present" }, // Wet watermelon got the most germs.
    { show: { photo: 4 }, mood: "smug", gesture: "handsHips" }, // The five-second rule? A myth!
    { show: { split: [{ label: "CARPET", photo: 3 }, { label: "TILE", photo: 0 }] }, mood: "happy", gesture: "pointDown" }, // Carpet passed the fewest germs, but longer meant more.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // What food did you rescue from the floor?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["five", "thousand", "second.", "watermelon", "myth!", "fewest", "rescue"],
};
