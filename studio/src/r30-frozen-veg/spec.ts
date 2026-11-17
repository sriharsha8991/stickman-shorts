import type { RealSpec } from "../shared/realcheck";
// R30 · Are frozen vegetables less healthy than fresh? Real Check #30, Arm B (no Spark). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Li, Pegg et al. 2017, J Food Compos Anal, doi:10.1016/j.jfca.2017.02.002; Rickman, Barrett & Bruhn 2007,
// J Sci Food Agric 87:930–944; Favell 1998, Food Chemistry 62:59–64; read 17 Nov 2026).
// Photos live in Drive: Photo library / "R30 · Are frozen vegetables less healthy than fresh? — photos" (doc 1FFxwOe3CC1c8K7c_gz3pkXcP5nfr7nTsa3Xf0sgPUO4);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R30",
  slug: "r30-frozen-veg",
  n: 30,
  bg: "#0a4d68",
  accent: "#ffcf56",
  overlay: "FROZEN = WORSE?",
  spark: false,
  photos: [
    { file: "frozen-peas.jpg", credit: "Frenkieb, CC BY 2.0 (Flickr)", focus: [0.4, 0.55], zoom: [1.0, 1.08] },
    { file: "blend.jpg", credit: "Joelk75, CC BY 2.0 (Flickr)", focus: [0.5, 0.5], zoom: [1.0, 1.08] },
    { file: "pods.jpg", credit: "Scarygami, CC BY-SA 2.0 (Flickr)", focus: [0.6, 0.6], zoom: [1.0, 1.06] },
    { file: "fridge-bin.jpg", credit: "Alabama Extension, CC0 (Wikimedia Commons)", focus: [0.4, 0.55], zoom: [1.02, 1.1] },
    { file: "market.jpg", credit: "USDA, CC BY 2.0 (Flickr)", focus: [0.4, 0.55], zoom: [1.0, 1.08] },
    { file: "frozen-peas.jpg", credit: "Frenkieb, CC BY 2.0 (Flickr)", focus: [0.35, 0.5], zoom: [1.12, 1.2] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Frozen vegetables? Before you skip them, are they worse?
    { show: { photo: 1 }, tag: "8 FOODS · 2 YEARS", mood: "neutral", gesture: "pointSide" }, // A two-year test checked eight foods.
    { show: { split: [{ label: "FRESH", photo: 2 }, { label: "FROZEN", photo: 0 }] }, tag: "MOSTLY EQUAL", mood: "shock", gesture: "recoil" }, // Most vitamins came out the same.
    { show: { photo: 3 }, tag: "5 FRIDGE DAYS", mood: "neutral", gesture: "present" }, // After five fridge days, fresh sometimes fell behind.
    { show: { photo: 5 }, mood: "smug", gesture: "handsHips" }, // Worse than fresh ones? Myth!
    { show: { photo: 4 }, tag: "FADES AFTER PICKING", mood: "neutral", gesture: "pointSide" }, // Fresh looks better, but its vitamins fade after picking.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Which frozen vegetable do you always buy?
  ],
  verdict: "MYTH",
  verdictAt: [4, 4],
  hi: ["worse?", "eight", "same.", "fridge", "Myth!", "picking.", "buy?"],
};
