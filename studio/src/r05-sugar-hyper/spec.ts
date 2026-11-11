import type { RealSpec } from "../shared/realcheck";
// R05 · Does sugar make children hyper? Real Check #5, Arm B (no Spark). Plan v5.1 (7 lines).
// Facts: facts.md (Wolraich, Wilson & White 1995 JAMA meta-analysis; Hoover & Milich 1994 J Abnorm Child Psychol).
// Photos live in Drive: Photo library / "R05 · Sugar and hyper kids — photos" (doc 1IC8kepWuWILfwDa2C-wbn9Uc_N2AqKJPRzAcEW7O5wU);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R05",
  slug: "r05-sugar-hyper",
  n: 5,
  bg: "#b5174f",
  accent: "#7cf0c5",
  overlay: "SUGAR = HYPER?",
  spark: false,
  photos: [
    { file: "cake.jpg", credit: "nick.amoscato, CC BY 2.0 (Flickr)", focus: [0.4, 0.45], zoom: [1.0, 1.08] },
    { file: "cubes.jpg", credit: "rockindave1, CC BY 2.0 (Flickr)", focus: [0.5, 0.4], zoom: [1.0, 1.1] },
    { file: "tabs.jpg", credit: "Centhum, CC BY-SA 3.0 (Wikimedia Commons)", focus: [0.32, 0.45], zoom: [1.0, 1.08] },
    { file: "cake.jpg", credit: "nick.amoscato, CC BY 2.0 (Flickr)", focus: [0.35, 0.4], zoom: [1.15, 1.3] },
  ],
  beats: [
    { show: { photo: 0 } }, // Before you blame the sugar, are your kids hyper? Why?
    { show: { photo: 1 }, tag: "23 BLIND TESTS" }, // Scientists pooled twenty-three blind tests.
    { show: { split: [{ label: "SUGAR", photo: 1 }, { label: "SWEETENER", photo: 2 }] } }, // Children got sugar or a sweetener, and nobody knew which.
    { show: { card: "NO CLEAR DIFFERENCE" } }, // Their behaviour showed no clear difference.
    { show: { photo: 3 } }, // The sugar rush is a myth!
    { show: { split: [{ label: "MUMS TOLD", text: "SUGAR" }, { label: "KIDS GOT", text: "NONE" }] } }, // Mothers who only thought there was sugar saw more hyper sons.
    { show: { photo: 0 } }, // Do you still believe it a little?
  ],
  verdict: "MYTH",
  verdictAt: [4, 5],
  hi: ["hyper?", "twenty-three", "nobody", "difference.", "myth!", "thought", "little?"],
};
