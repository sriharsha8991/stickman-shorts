import type { RealSpec } from "../shared/realcheck";
// R26 · Does your fridge waste your bread before you eat it? Real Check #26, Arm B (no Spark). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Aguirre et al. 2011, Starch/Stärke 63(9):587–593; Clemson HGIC; Mercer, Univ. of Guelph / IUFoST; read 15–16 Nov 2026).
// Photos live in Drive: Photo library / "R26 · Does your fridge make bread stale faster? — photos" (doc 1enWhegwc7hD-5tOD865ZsJg3TKZoBs9x0SnflbGwSdc);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R26",
  slug: "r26-bread-fridge",
  n: 26,
  bg: "#2b5d34",
  accent: "#ffb703",
  overlay: "FRIDGE = STALE?",
  spark: false,
  photos: [
    { file: "slices.jpg", credit: "How can I recycle this, CC BY 2.0 (Wikimedia Commons)", focus: [0.5, 0.5], zoom: [1.0, 1.08] },
    { file: "fridge.jpg", credit: "USDA, public domain (Flickr)", focus: [0.35, 0.55], zoom: [1.0, 1.1] },
    { file: "frozen.jpg", credit: "tiefkuehlfan, CC BY-SA 2.0 (Flickr)", focus: [0.25, 0.55], zoom: [1.12, 1.2] },
    { file: "slices.jpg", credit: "How can I recycle this, CC BY 2.0 (Wikimedia Commons)", focus: [0.55, 0.5], zoom: [1.12, 1.22] },
    { file: "frozen.jpg", credit: "tiefkuehlfan, CC BY-SA 2.0 (Flickr)", focus: [0.3, 0.6], zoom: [1.25, 1.35] },
  ],
  beats: [
    { show: { photo: 0 } }, // Does your fridge waste your bread before you eat it?
    { show: { card: "3 TEMPERATURES", sub: "25°C · 4°C · −18°C · LAB TEST, 2011" } }, // A twenty eleven lab test kept bread three ways.
    { show: { photo: 1 }, tag: "4°C: FASTEST" }, // In the fridge, at four degrees, staling was fastest.
    { show: { photo: 2 }, tag: "−18°C: ALMOST STOPS" }, // In the freezer, staling almost stopped.
    { show: { photo: 3 } }, // Stale faster in the fridge? True!
    { show: { photo: 4 }, tag: "FREEZE SLICES" }, // Cold slows spoilage, so it feels right. Freeze slices instead.
    { show: { photo: 0 } }, // Where do you keep your bread?
  ],
  verdict: "TRUE",
  verdictAt: [4, 5],
  hi: ["waste", "three", "fastest.", "stopped.", "True!", "Freeze", "bread?"],
};
