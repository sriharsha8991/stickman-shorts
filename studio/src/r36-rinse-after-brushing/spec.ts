import type { RealSpec } from "../shared/realcheck";
// R36 · Brushed your teeth? Before you rinse, does water ruin it? Real Check #36, Arm B (no Spark). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Sjögren & Melin, Gerodontology 2001;18(1):15-20: a larger volume of rinse water substantially decreased
// fluoride retention; Machiulskiene, Richards, Nyvad & Baelum, Caries Res 2002 (PMID 12399689): 3 years, 276 children examined,
// DMFS increments 6.8 rinsed with water vs 6.2 spat only vs 12.4 control school, rinse vs spit not significant;
// NHS "How to keep your teeth clean": don't rinse your mouth immediately after brushing; read 19 Nov 2026).
// Photos live in Drive: Photo library / "R36 · Rinsing after brushing — photos" (doc 1Xhazm9WuZtgKF3ziZ_13Ceh7vEY3w-o9od0uzAAuGkY);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R36",
  slug: "r36-rinse-after-brushing",
  n: 36,
  bg: "#5a189a",
  accent: "#7ae7c7",
  overlay: "SPIT OR RINSE?",
  spark: false,
  photos: [
    { file: "brush.jpg", credit: "wwarby, CC BY 2.0 (Flickr)", focus: [0.6, 0.45], zoom: [1.0, 1.08] },
    { file: "tap2.jpg", credit: "Joe Pell, CC BY 2.0 (Flickr)", focus: [0.45, 0.5], zoom: [1.0, 1.08] },
    { file: "xray.jpg", credit: "jasonwoodhead23, CC BY 2.0 (Flickr)", focus: [0.55, 0.5], zoom: [1.0, 1.08] },
    { file: "brush.jpg", credit: "wwarby, CC BY 2.0 (Flickr)", focus: [0.62, 0.4], zoom: [1.15, 1.22] },
    { file: "sink.jpg", credit: "Michael Burridge, CC0 (WordPress Photos)", focus: [0.45, 0.5], zoom: [1.0, 1.07] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Brushed your teeth? Before you rinse, does water ruin it?
    { show: { photo: 1 }, tag: "LESS FLUORIDE", mood: "neutral", gesture: "pointSide" }, // In 2001, big rinses left less fluoride.
    { show: { photo: 2 }, tag: "3-YEAR STUDY", mood: "neutral", gesture: "present" }, // A three-year study compared rinsers and spitters.
    { show: { split: [{ label: "RINSED", text: "6.8" }, { label: "SPAT ONLY", text: "6.2" }] }, mood: "shock", gesture: "recoil" }, // Their cavities were nearly equal.
    { show: { photo: 3 }, mood: "smug", gesture: "handsHips" }, // Rinsing ruins it? Half true!
    { show: { photo: 4 }, tag: "SPIT, DON'T RINSE", mood: "neutral", gesture: "pointDown" }, // Fluoride still drops, so the NHS says spit, don't rinse.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Do you rinse after you brush?
  ],
  verdict: "HALF TRUE",
  verdictAt: [4, 3],
  hi: ["rinse,", "fluoride.", "three-year", "equal.", "Half", "spit,", "brush?"],
};
