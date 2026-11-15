import type { RealSpec } from "../shared/realcheck";
// R24 · Should hot food cool before the fridge? Real Check #24, Arm B (no Spark). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (USDA FSIS "Leftovers and Food Safety" + "How Temperatures Affect Food", read 15 Nov 2026).
// Photos live in Drive: Photo library / "R24 · Hot food in the fridge — photos" (doc 1cmwVIKIrQRjN2LarDewiioQUcFH8bnO22GnXMhnz6Og);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R24",
  slug: "r24-hot-food-fridge",
  n: 24,
  bg: "#0077b6",
  accent: "#ff4d00",
  overlay: "COOL IT FIRST?",
  spark: false,
  photos: [
    { file: "soup.jpg", credit: "acnatta, CC BY 2.0 (Flickr)", focus: [0.5, 0.62], zoom: [1.0, 1.08] },
    { file: "bacteria.jpg", credit: "Gaurav, CC BY 4.0 (Wikimedia Commons)", focus: [0.5, 0.5], zoom: [1.05, 1.18] },
    { file: "fridge.jpg", credit: "W.carter, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.55, 0.5], zoom: [1.0, 1.1] },
    { file: "boxes.jpg", credit: "USDA, public domain (Flickr)", focus: [0.35, 0.5], zoom: [1.05, 1.15] },
    { file: "soup.jpg", credit: "acnatta, CC BY 2.0 (Flickr)", focus: [0.5, 0.6], zoom: [1.15, 1.25] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Your food is hot. Should it cool before the fridge?
    { show: { photo: 1 }, tag: "DOUBLES: 20 MIN", mood: "shock", gesture: "recoil" }, // Bacteria in warm food can double in twenty minutes.
    { show: { card: "2 HOURS", sub: "USDA FOOD SAFETY RULE" }, mood: "neutral", gesture: "pointSide" }, // US food rules: chill it within two hours.
    { show: { photo: 2 }, tag: "STRAIGHT IN", mood: "happy", gesture: "present" }, // Hot food can go straight in.
    { show: { photo: 4 }, mood: "smug", gesture: "handsHips" }, // Cool it first? That's a myth!
    { show: { photo: 3 }, tag: "SHALLOW BOXES", mood: "happy", gesture: "pointDown" }, // Big pot? Divide it into shallow containers.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // Do you leave dinner out to cool?
  ],
  verdict: "MYTH",
  verdictAt: [4, 5],
  hi: ["hot.", "twenty", "two", "straight", "myth!", "shallow", "cool?"],
};
