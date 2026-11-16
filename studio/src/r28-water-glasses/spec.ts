import type { RealSpec } from "../shared/realcheck";
// R28 · Do you really need eight glasses of water a day? Real Check #28, Arm B (no Spark). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Yamada et al. 2022, Science 378(6622):909, doi 10.1126/science.abm8668 + Univ. of Aberdeen release;
// National Academies 2004 water/electrolytes DRI report release; read 16 Nov 2026).
// Photos live in Drive: Photo library / "R28 · Do you really need eight glasses of water a day? — photos" (doc 1oVPK7oePB3Ae75_iRaKftuHSCJ4S5os5EFEgaOKWPUU);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R28",
  slug: "r28-water-glasses",
  n: 28,
  bg: "#006466",
  accent: "#ffd60a",
  overlay: "8 GLASSES A DAY?",
  spark: false,
  photos: [
    { file: "glass.jpg", credit: "openuser, CC BY-SA 2.0 (Flickr)", focus: [0.5, 0.3], zoom: [1.0, 1.06] },
    { file: "crowd.jpg", credit: "VinothChandar, CC BY 2.0 (Flickr)", focus: [0.5, 0.42], zoom: [1.6, 1.7] },
    { file: "heat.jpg", credit: "mastermaq, CC BY-SA 2.0 (Flickr)", focus: [0.55, 0.3], zoom: [1.05, 1.12] },
    { file: "melon.jpg", credit: "waferboard, CC BY 2.0 (Flickr)", focus: [0.5, 0.5], zoom: [1.0, 1.08] },
    { file: "glass.jpg", credit: "openuser, CC BY-SA 2.0 (Flickr)", focus: [0.5, 0.4], zoom: [1.12, 1.2] },
    { file: "sun.jpg", credit: "Public Domain Photos, CC BY 2.0 (Flickr)", focus: [0.55, 0.4], zoom: [1.0, 1.08] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Are you wasting effort on eight glasses before you're thirsty?
    { show: { photo: 1 }, tag: "5,604 PEOPLE", mood: "neutral", gesture: "pointSide" }, // One study tracked over five thousand people.
    { show: { photo: 2 }, tag: "HEAT + EXERCISE", mood: "shock", gesture: "recoil" }, // Heat and exercise changed their needs.
    { show: { photo: 3 }, tag: "1/5 FROM FOOD", mood: "happy", gesture: "present" }, // A fifth of your water comes from food.
    { show: { photo: 4 }, mood: "smug", gesture: "handsHips" }, // Eight glasses for everyone? Myth!
    { show: { photo: 5 }, tag: "FOLLOW THIRST", mood: "neutral", gesture: "pointSide" }, // Hot day or workout? Drink more, and follow your thirst.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // How many glasses do you drink a day?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["wasting", "thousand", "exercise", "fifth", "Myth!", "thirst.", "day?"],
};
