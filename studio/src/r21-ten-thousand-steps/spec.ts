import type { RealSpec } from "../shared/realcheck";
// R21 · Do you need ten thousand steps a day? Real Check #21, Arm A (Spark reactor). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Paluch et al. 2022, Lancet Public Health; Lee et al. 2019, JAMA Internal Medicine, via Harvard Gazette).
// Photos live in Drive: Photo library / "R21 · Ten thousand steps — photos" (doc 1hbqeu4ALcYi8t79uYU2H4BvpCfbxRU_FiNRPa8r_gFg);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R21",
  slug: "r21-ten-thousand-steps",
  n: 21,
  bg: "#7a1f3d",
  accent: "#9ef01a",
  overlay: "10,000 STEPS?",
  spark: true,
  photos: [
    { file: "boots.jpg", credit: "Artem Beliaikin, CC0 (Flickr)", focus: [0.5, 0.7], zoom: [1.05, 1.14] },
    { file: "pedometer.jpg", credit: "Marvin 101, CC BY-SA 3.0 (Wikimedia Commons)", focus: [0.5, 0.45], zoom: [1.0, 1.1] },
    { file: "couple.jpg", credit: "Alan Cleaver, CC BY 2.0 (Flickr)", focus: [0.88, 0.75], zoom: [1.1, 1.3] },
    { file: "boots.jpg", credit: "Artem Beliaikin, CC0 (Flickr)", focus: [0.4, 0.8], zoom: [1.3, 1.42] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Ten thousand steps? Before you walk, do you need them?
    { show: { photo: 1 }, tag: "JUST AN AD", mood: "shock", gesture: "recoil" }, // It began as a Japanese advert.
    { show: { card: "47,471", sub: "ADULTS · 15 STUDIES · LANCET 2022" }, mood: "neutral", gesture: "pointSide" }, // Studies tracked forty-seven thousand adults.
    { show: { photo: 2 }, tag: "60+: 6–8K", mood: "curious", gesture: "present" }, // Over sixty, benefits flattened near seven thousand.
    { show: { photo: 3 }, mood: "smug", gesture: "handsHips" }, // Ten thousand a must? A myth!
    { show: { card: "8,000–10,000", sub: "STEPS · WHERE GAINS FLATTENED UNDER 60" }, mood: "happy", gesture: "pointDown" }, // Under sixty, that point was eight to ten thousand.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // How many steps did you walk today?
  ],
  verdict: "MYTH",
  verdictAt: [4, 5],
  hi: ["thousand", "Japanese", "forty-seven", "seven", "myth!", "eight", "today?"],
};
