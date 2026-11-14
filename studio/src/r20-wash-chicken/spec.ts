import type { RealSpec } from "../shared/realcheck";
// R20 · Does washing raw chicken make it safer? Real Check #20, Arm B (no Spark). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (USDA observational study, press release 20 Aug 2019; USDA FSIS "Washing Food: Does it Promote Food Safety?").
// Photos live in Drive: Photo library / "R20 · Washing raw chicken — photos" (doc 1FGmaenkCxhj4n_71lrq1XUlvCrWTk17WEyXr_LzSHQY);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
// sink.jpg has a green bottle with a blurred label at the far right: focus left keeps it out of the 9:16 frame.
export const SPEC: RealSpec = {
  id: "R20",
  slug: "r20-wash-chicken",
  n: 20,
  bg: "#33475b",
  accent: "#ffe066",
  overlay: "WASH RAW CHICKEN?",
  spark: false,
  photos: [
    { file: "chicken.jpg", credit: "trenttsd, CC BY 2.0 (Flickr)", focus: [0.45, 0.45], zoom: [1.05, 1.14] },
    { file: "sink.jpg", credit: "espensorvik, CC BY 2.0 (Flickr)", focus: [0.35, 0.5], zoom: [1.0, 1.1] },
    { file: "lemon.jpg", credit: "Doug Beckers, CC BY-SA 2.0 (Flickr)", focus: [0.5, 0.5], zoom: [1.0, 1.1] },
    { file: "cooked.jpg", credit: "USDA, public domain (Flickr)", focus: [0.55, 0.5], zoom: [1.0, 1.08] },
    { file: "hands.jpg", credit: "Beat Ruest, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.6, 0.5], zoom: [1.0, 1.08] },
    { file: "chicken.jpg", credit: "trenttsd, CC BY 2.0 (Flickr)", focus: [0.4, 0.4], zoom: [1.3, 1.42] },
  ],
  beats: [
    { show: { photo: 0 } }, // Raw chicken? Before you wash it, is it safer?
    { show: { card: "6 IN 10", sub: "WASHERS HAD GERMS IN THE SINK · USDA TEST, 2019" } }, // In a US test, six in ten washers got germs in the sink.
    { show: { photo: 1 }, tag: "AFTER CLEANING" }, // Some stayed even after cleaning.
    { show: { photo: 2 }, tag: "STILL GERMS" }, // Salt or lemon won't kill them.
    { show: { photo: 5 } }, // Washing for safety? A myth!
    { show: { split: [{ label: "COOK IT", photo: 3 }, { label: "WASH HANDS", photo: 4 }] } }, // Only cooking kills them. Wash your hands instead.
    { show: { photo: 0 } }, // Does your family wash the chicken first?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["chicken?", "six", "stayed", "lemon", "myth!", "cooking", "family"],
};
