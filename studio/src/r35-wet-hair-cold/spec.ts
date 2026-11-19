import type { RealSpec } from "../shared/realcheck";
// R35 · Wet hair? Before you step out, will you catch cold? Real Check #35, Arm A (Spark reactor). Plan v5.1 (7 lines), bridge TTS row.
// Facts: facts.md (CDC "About Common Cold": more than 200 viruses, rhinoviruses most frequent; Douglas, Lindgren & Couch,
// NEJM 1968;279:742-7 "Exposure to cold environment and rhinovirus common cold: failure to demonstrate effect";
// Johnson & Eccles, Family Practice 2005;22:608-13: 13/90 chilled vs 5/90 controls reported a cold in 4-5 days;
// Foxman et al., PNAS 2015/2016: rhinovirus copies better at nose temperature (33 °C) than at 37 °C; read 18-19 Nov 2026).
// Photos live in Drive: Photo library / "R35 · Wet hair and catching a cold — photos" (doc 18ANjnq5jgR9lbNYkXUiOtXWvM7V0oQ60skDUe2z2lFw);
// pull them with tools/drive_photos.py (PIPELINE_V5.md §3). Licences + sources: photos.json.
export const SPEC: RealSpec = {
  id: "R35",
  slug: "r35-wet-hair-cold",
  n: 35,
  bg: "#123c69",
  accent: "#ff9b71",
  overlay: "WET HAIR = COLD?",
  spark: true,
  photos: [
    { file: "hair_brush.jpg", credit: "geehairimages, CC BY 2.0 (Flickr)", focus: [0.42, 0.45], zoom: [1.0, 1.08] },
    { file: "virus.jpg", credit: "T. Splettstoesser, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.5, 0.5], zoom: [1.0, 1.1] },
    { file: "snow_amsterdam.jpg", credit: "Lauri Väin, CC BY 2.0 (Flickr)", focus: [0.45, 0.6], zoom: [1.0, 1.06] },
    { file: "hair_brush.jpg", credit: "geehairimages, CC BY 2.0 (Flickr)", focus: [0.4, 0.4], zoom: [1.15, 1.22] },
    { file: "virus.jpg", credit: "T. Splettstoesser, CC BY-SA 4.0 (Wikimedia Commons)", focus: [0.5, 0.5], zoom: [1.3, 1.4] },
  ],
  beats: [
    { show: { photo: 0 }, mood: "curious", gesture: "thinkChin" }, // Wet hair? Before you step out, will you catch cold?
    { show: { photo: 1 }, tag: "200+ VIRUSES", mood: "neutral", gesture: "pointSide" }, // Two hundred viruses cause colds, not cold air.
    { show: { photo: 2 }, tag: "1968: NO CHANGE", mood: "shock", gesture: "present" }, // Chilling people given the virus changed nothing.
    { show: { split: [{ label: "WARM FEET", text: "5 COLDS" }, { label: "CHILLED FEET", text: "13 COLDS" }] }, mood: "shock", gesture: "recoil" }, // But chilled feet doubled the colds.
    { show: { photo: 3 }, mood: "smug", gesture: "handsHips" }, // Wet hair, more colds? Half true!
    { show: { photo: 4 }, tag: "MAY WAKE ONE", mood: "neutral", gesture: "pointDown" }, // Cold makes no virus, but may wake one you carry.
    { show: { photo: 0 }, mood: "wink", gesture: "doublePoint" }, // What winter warning did your family give you?
  ],
  verdict: "HALF TRUE",
  verdictAt: [4, 4],
  hi: ["Wet", "viruses,", "nothing.", "doubled", "Half", "wake", "family"],
};
