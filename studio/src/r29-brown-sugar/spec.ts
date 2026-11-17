import type { RealSpec } from "../shared/realcheck";
// R29 · Is brown sugar healthier than white sugar? Real Check #29, Arm A (Spark reactor). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (USDA FoodData Central SR Legacy "Sugars, brown" / "Sugars, granulated" via EUFIC 2026; NIH ODS calcium; read 17 Nov 2026).
// Photos live in Drive: Photo library / "R29 · Is brown sugar healthier than white sugar? — photos" (doc 1n7Qx5tC90sFmjo73Nzhff5SMgz3eshDKQl3azf71-Ik);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R29",
  slug: "r29-brown-sugar",
  n: 29,
  bg: "#5f0f40",
  accent: "#fb8b24",
  overlay: "BROWN = HEALTHIER?",
  spark: true,
  photos: [
    { file: "cubes.jpg", credit: "KJGarbutt, CC BY 2.0 (Flickr)", focus: [0.5, 0.55], zoom: [1.0, 1.06] },
    { file: "molasses.jpg", credit: "technicool, CC BY 2.0 (Flickr)", focus: [0.78, 0.6], zoom: [1.05, 1.12] },
    { file: "demerara.jpg", credit: "Elenadan, CC BY 2.0 (Flickr)", focus: [0.5, 0.5], zoom: [1.0, 1.08] },
    { file: "cubes.jpg", credit: "KJGarbutt, CC BY 2.0 (Flickr)", focus: [0.45, 0.5], zoom: [1.12, 1.2] },
    { file: "spoon-alt.jpg", credit: "richmooremi, CC BY 2.0 (Flickr)", focus: [0.45, 0.45], zoom: [1.0, 1.08] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Brown sugar? Before you pay more, is it healthier?
    { show: { photo: 1 }, tag: "+ MOLASSES", mood: "neutral", gesture: "pointSide" }, // It is often white sugar plus molasses.
    { show: { card: "380 vs 387", sub: "CALORIES PER 100 G · BROWN vs WHITE · USDA" }, mood: "shock", gesture: "recoil" }, // It has two percent fewer calories.
    { show: { photo: 2 }, tag: "<1% CALCIUM", mood: "neutral", gesture: "present" }, // A teaspoon gives under one percent of daily calcium.
    { show: { photo: 3 }, mood: "smug", gesture: "handsHips" }, // Healthier than white sugar? Myth!
    { show: { photo: 4 }, tag: "BOTH = SUGAR", mood: "neutral", gesture: "pointSide" }, // It looks natural, but your body counts both as sugar.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Which sugar goes in your tea?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["healthier?", "molasses.", "calories.", "calcium.", "Myth!", "sugar.", "tea?"],
};
