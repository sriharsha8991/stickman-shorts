import type { RealSpec } from "../shared/realcheck";
// R25 · Does your AC cost you more fuel than open windows? Real Check #25, Arm A (Spark reactor). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (fueleconomy.gov "Driving in hot weather"; ORNL / Huff, West & Thomas, SAE 2013-01-0551; ORNL release 2014; read 15 Nov 2026).
// Photos live in Drive: Photo library / "R25 · Car AC vs open windows — photos" (doc 1aGfm9V6cBnHFaCA28O6FiQaulLarTkIrLSeOIkF5G4I);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R25",
  slug: "r25-car-ac",
  n: 25,
  bg: "#6a040f",
  accent: "#48cae4",
  overlay: "AC OR WINDOWS?",
  spark: true,
  photos: [
    { file: "vent.jpg", credit: "Mr Thinktank, CC BY 2.0 (Flickr)", focus: [0.55, 0.5], zoom: [1.0, 1.08] },
    { file: "gauge.jpg", credit: "Petar Milošević, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.45, 0.55], zoom: [1.0, 1.1] },
    { file: "highway.jpg", credit: "Horia Varlan, CC BY 2.0 (Flickr)", focus: [0.5, 0.55], zoom: [1.0, 1.12] },
    { file: "traffic.jpg", credit: "Jay Bergesen, CC BY 2.0 (Wikimedia Commons)", focus: [0.0, 0.66], zoom: [1.85, 1.9] },
    { file: "vent.jpg", credit: "Mr Thinktank, CC BY 2.0 (Flickr)", focus: [0.55, 0.5], zoom: [1.12, 1.22] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Does your AC cost you more fuel than open windows?
    { show: { photo: 1 }, tag: "OVER 25%", mood: "shock", gesture: "recoil" }, // In heat, AC can cut mileage by over a quarter.
    { show: { card: "4–8.5%", sub: "WINDOWS DOWN · US LAB TEST (ORNL)" }, mood: "neutral", gesture: "pointSide" }, // Open windows cost about four to eight percent.
    { show: { photo: 2 }, tag: "MORE DRAG", mood: "curious", gesture: "present" }, // At highway speed, they add drag.
    { show: { photo: 4 }, mood: "smug", gesture: "handsHips" }, // AC burns more fuel? Half true!
    { show: { photo: 3 }, tag: "TOWN: WINDOWS", mood: "happy", gesture: "pointDown" }, // In town, windows down. On highways, use AC.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Which do you pick, AC or windows?
  ],
  verdict: "HALF TRUE",
  verdictAt: [4, 4],
  hi: ["fuel", "quarter.", "eight", "drag.", "Half", "AC.", "windows?"],
};
