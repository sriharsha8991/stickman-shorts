import type { RealSpec } from "../shared/realcheck";
// R31 · Can reheating leftover rice make you sick? Real Check #31, Arm A (Spark reactor). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (Food Standards Scotland "Rice" consumer advice; Food Safety Authority of Ireland, Bacillus cereus
// factsheet 2016; read 17 Nov 2026). Education, not medical advice.
// Photos live in Drive: Photo library / "R31 · Can reheating leftover rice make you sick? — photos" (doc 136o1WssxXXm4AHyQvmjpUBm3DRN-1XyM1jm_uexzVGE);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R31",
  slug: "r31-reheat-rice",
  n: 31,
  bg: "#a33b0b",
  accent: "#8ff0ff",
  overlay: "REHEAT = SICK?",
  spark: true,
  photos: [
    { file: "bowl.jpg", credit: "TKdows 2026, CC0 (Wikimedia Commons)", focus: [0.45, 0.62], zoom: [1.0, 1.08] },
    { file: "cooker.jpg", credit: "mdid, CC BY 2.0 (Flickr)", focus: [0.5, 0.75], zoom: [1.0, 1.06] },
    { file: "spores.jpg", credit: "T. Nims, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.45, 0.6], zoom: [1.05, 1.12] },
    { file: "pot.jpg", credit: "Kvr.lohith, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.4, 0.5], zoom: [1.0, 1.08] },
    { file: "bowl.jpg", credit: "TKdows 2026, CC0 (Wikimedia Commons)", focus: [0.4, 0.68], zoom: [1.12, 1.2] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Leftover rice? Before you reheat, can it make you sick?
    { show: { split: [{ label: "COOKED", photo: 1 }, { label: "SPORES", photo: 2 }] }, tag: "SURVIVE COOKING", mood: "shock", gesture: "recoil" }, // Rice germs survive cooking as tough spores.
    { show: { photo: 3 }, tag: "HOURS = TOXIN", mood: "neutral", gesture: "pointSide" }, // Left warm for hours, they make a toxin.
    { show: { card: "126°C · 90 MIN", sub: "THE TOXIN STILL SURVIVES · FSAI" }, mood: "shock", gesture: "present" }, // Reheating cannot destroy that toxin.
    { show: { photo: 4 }, mood: "smug", gesture: "handsHips" }, // Reheated rice is risky? Half true!
    { show: { card: "FRIDGE IN 1 HOUR", sub: "EAT IN 24 H · REHEAT ONCE" }, mood: "happy", gesture: "pointDown" }, // The danger is the wait. Fridge it within an hour.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // How long does your rice sit out after dinner?
  ],
  verdict: "HALF TRUE",
  verdictAt: [4, 4],
  hi: ["sick?", "spores.", "hours,", "destroy", "Half", "hour.", "dinner?"],
};
