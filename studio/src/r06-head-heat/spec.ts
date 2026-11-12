import type { RealSpec } from "../shared/realcheck";
// R06 · Do you lose most of your heat through your head? Real Check #6, Arm A (Spark reactor). Plan v5.1 (7 lines).
// Facts: facts.md (Pretorius et al. 2006 J Appl Physiol 101:669-675; Vreeman & Carroll 2008 BMJ 337:a2769).
// Photos live in Drive: Photo library / "R06 · Head heat — photos" (doc 1gcL_ZCIImubkBeX4mF9BYnVEJL5zdxk1scyfsboT6hU);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R06",
  slug: "r06-head-heat",
  n: 6,
  bg: "#b4400f",
  accent: "#bfe9ff",
  overlay: "HEAT FROM HEAD?",
  spark: true,
  photos: [
    // white border of the market photo stays out of frame (zoom >= 1.1)
    { file: "hats.jpg", credit: "Mira Pangkey, CC BY 2.0 (Flickr)", focus: [0.45, 0.4], zoom: [1.12, 1.2] },
    { file: "beanie.jpg", credit: "mikecogh, CC BY-SA 2.0 (Flickr)", focus: [0.45, 0.5], zoom: [1.0, 1.08] },
    { file: "icehole.jpg", credit: "Tiia Monto, CC BY-SA 3.0 (Wikimedia Commons)", focus: [0.48, 0.45], zoom: [1.0, 1.12] },
    { file: "soldier.jpg", credit: "Sgt. James Garvin, U.S. Army, public domain (Wikimedia Commons)", focus: [0.55, 0.4], zoom: [1.0, 1.08] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Before grabbing a hat, does your head lose most heat?
    { show: { card: "7%", sub: "OF YOUR SKIN IS YOUR HEAD" }, mood: "shock", gesture: "recoil" }, // Your head is only seven percent of your skin.
    { show: { photo: 2 }, tag: "COLD WATER TEST", mood: "neutral", gesture: "pointSide" }, // Scientists measured heads in cold water.
    { show: { split: [{ label: "HEAD", text: "10%" }, { label: "REST OF BODY", text: "90%" }] }, mood: "curious", gesture: "present" }, // Heads lost only one tenth of the heat.
    { show: { photo: 1 }, mood: "smug", gesture: "handsHips" }, // Most heat through the head? A myth!
    { show: { photo: 3 }, tag: "ONLY HEADS BARE", mood: "happy", gesture: "pointDown" }, // An army test left only heads uncovered.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // What does your mum make you wear?
  ],
  verdict: "MYTH",
  verdictAt: [4, 6],
  hi: ["head", "seven", "cold", "tenth", "myth!", "uncovered.", "wear?"],
};
